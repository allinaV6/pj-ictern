require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =====================
// MySQL Connection
// =====================
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "2546",
  database: process.env.DB_NAME || "ictern",
  port: process.env.DB_PORT || 3306,
});

const DEFAULT_IMPORTED_USER_PASSWORD = "123456";

// test connection
(async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ Connected to MySQL");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err);
  }
})();

// ==================================================
// LOGIN
// ==================================================
app.post("/api/auth/firebase-login", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("📩 login request:", email);

    // 🔥 เช็ค admin ก่อน
    const [adminRows] = await db.query(
      "SELECT * FROM admin WHERE email = ?",
      [email]
    );

    if (adminRows.length > 0) {
      console.log("✅ ADMIN LOGIN");
      return res.json({
        role: "admin",
        user: adminRows[0]
      });
    }

    // 🔥 ถ้าไม่ใช่ admin → เช็ค student
    const [studentRows] = await db.query(
      "SELECT * FROM student WHERE email = ?",
      [email]
    );

    if (studentRows.length > 0) {
      console.log("✅ STUDENT LOGIN");
      return res.json({
        role: "student",
        user: studentRows[0]
      });
    }

    // ❌ ไม่เจอ
    return res.status(404).json({
      message: "User not found"
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});

// ==================================================
// USERS (ADMIN)
// ==================================================
app.get("/api/users", async (req, res) => {
  try {
    const roleParam = typeof req.query.role === 'string' ? req.query.role.toLowerCase() : 'students';
    const roleFilter = roleParam === 'admins' ? 'admins' : 'students';

    const whereClause = roleFilter === 'admins'
      ? "WHERE a.role <> 'Student'"
      : "WHERE a.role = 'Student'";

    const [rows] = await db.query(
      `
      SELECT
        a.account_id,
        a.username,
        a.role,
        a.account_status,
        s.student_id,
        s.student_name,
        s.student_faculty,
        s.student_major,
        ios.company_id as internship_company_id,
        c.company_name as internship_company_name
      FROM account a
      LEFT JOIN student s ON s.account_id = a.account_id
      LEFT JOIN (
        SELECT t.student_id, t.company_id
        FROM internship_of_student t
        JOIN (
          SELECT student_id, MAX(student_internship_id) AS max_id
          FROM internship_of_student
          GROUP BY student_id
        ) x
          ON x.student_id = t.student_id AND x.max_id = t.student_internship_id
      ) ios ON ios.student_id = s.student_id
      LEFT JOIN company c ON c.company_id = ios.company_id
      ${whereClause}
      ORDER BY s.student_id DESC, a.account_id DESC
      `
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `
      SELECT
        a.account_id,
        a.username,
        a.role,
        a.account_status,
        s.student_id,
        s.student_name,
        s.student_faculty,
        s.student_major,
        ios.company_id as internship_company_id,
        c.company_name as internship_company_name
      FROM account a
      LEFT JOIN student s ON s.account_id = a.account_id
      LEFT JOIN (
        SELECT t.student_id, t.company_id
        FROM internship_of_student t
        JOIN (
          SELECT student_id, MAX(student_internship_id) AS max_id
          FROM internship_of_student
          GROUP BY student_id
        ) x
          ON x.student_id = t.student_id AND x.max_id = t.student_internship_id
      ) ios ON ios.student_id = s.student_id
      LEFT JOIN company c ON c.company_id = ios.company_id
      WHERE a.account_id = ?
      LIMIT 1
      `,
      [id]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      account_status,
      student_name,
      student_faculty,
      student_major,
      internship_company_id
    } = req.body;

    const [current] = await db.query(
      "SELECT account_id, role FROM account WHERE account_id = ? LIMIT 1",
      [id]
    );
    if (!current || current.length === 0) return res.status(404).json({ message: "User not found" });

    await db.query(
      "UPDATE account SET username = ?, account_status = ? WHERE account_id = ?",
      [username, typeof account_status === "number" ? account_status : 1, id]
    );

    if (current[0].role === 'Student') {
      const [studentRows] = await db.query("SELECT student_id FROM student WHERE account_id = ? LIMIT 1", [id]);
      if (studentRows.length > 0) {
        const studentId = studentRows[0].student_id;
        await db.query(
          "UPDATE student SET student_name = ?, student_faculty = ?, student_major = ? WHERE account_id = ?",
          [student_name || null, student_faculty || null, student_major || null, id]
        );

        if (typeof internship_company_id === "number") {
          const [activeRows] = await db.query(
            "SELECT student_internship_id FROM internship_of_student WHERE student_id = ? AND (end_date IS NULL) ORDER BY student_internship_id DESC LIMIT 1",
            [studentId]
          );
          if (activeRows.length > 0) {
            await db.query(
              "UPDATE internship_of_student SET company_id = ? WHERE student_internship_id = ?",
              [internship_company_id, activeRows[0].student_internship_id]
            );
          } else {
            await db.query(
              "INSERT INTO internship_of_student (student_id, company_id, start_date, student_internship_status) VALUES (?, ?, NOW(), 1)",
              [studentId, internship_company_id]
            );
          }
        }
      }
    }

    res.json({ message: "User updated" });
  } catch (err) {
    console.error(err);
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username ซ้ำ" });
    }
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/users/import", async (req, res) => {
  try {
    const rows = Array.isArray(req.body) ? req.body : [];
    const normalizeExcelKey = (key) =>
      String(key || '').trim().toLowerCase().replace(/[\W_]+/g, '');

    const normalizedRows = rows.map((row) => {
      const normalized = {};
      Object.entries(row).forEach(([key, value]) => {
        normalized[normalizeExcelKey(key)] = value;
      });

      const getValue = (...keys) => {
        for (const key of keys) {
          const normalizedKey = normalizeExcelKey(key);
          if (normalized[normalizedKey] !== undefined && normalized[normalizedKey] !== null) {
            return normalized[normalizedKey];
          }
        }

        const normalizedKeys = Object.keys(normalized);
        for (const key of keys) {
          const normalizedKey = normalizeExcelKey(key);
          const match = normalizedKeys.find(
            (rowKey) => rowKey.includes(normalizedKey) || normalizedKey.includes(rowKey)
          );
          if (match) {
            return normalized[match];
          }
        }
        return '';
      };

      const accountId = Number(
        getValue('Account ID', 'account_id', 'AccountId', 'accountid', 'รหัสบัญชี', 'รหัสผู้ใช้', 'ID') || 0
      );
      const roleRaw = String(getValue('Role', 'role', 'บทบาท') || '').trim();
      const roleLower = roleRaw.toLowerCase();
      const role = roleLower.includes('admin') || roleLower.includes('ผู้ดูแล') || roleLower.includes('แอดมิน') ? 'Admin' : 'Student';
      const username = String(
        getValue('Username', 'username', 'Name', 'name', 'student_name', 'ชื่อ-นามสกุล', 'ชื่อ') || ''
      ).trim();
      const statusRaw = String(getValue('Status', 'status', 'สถานะ') || '').trim().toLowerCase();
      const account_status = statusRaw === 'inactive' || statusRaw === '0' || statusRaw.includes('inactive') || statusRaw.includes('ปิด') ? 0 : 1;
      const studentId = Number(getValue('Student ID', 'student_id', 'รหัสนักศึกษา') || 0);

      return {
        accountId,
        role,
        username,
        account_status,
        student_id: studentId,
        student_name: String(getValue('Name', 'name', 'student_name', 'ชื่อ-นามสกุล', 'ชื่อ') || '').trim(),
        student_faculty: String(getValue('Faculty', 'faculty', 'คณะ') || '').trim(),
        student_major: String(getValue('Major', 'major', 'สาขา', 'Program', 'program') || '').trim(),
        internship_company_id: Number(getValue('Internship Company ID', 'internship_company_id', 'รหัสบริษัทฝึกงาน') || 0) || null,
      };
    });

    const rowMap = new Map();
    normalizedRows.forEach((row) => {
      let key = '';
      if (row.accountId > 0) {
        key = `id:${row.accountId}`;
      } else if (row.username) {
        key = `username:${String(row.username).trim().toLowerCase()}`;
      } else if (row.student_id > 0) {
        key = `student:${row.student_id}`;
      } else {
        key = `row:${Math.random()}`;
      }
      rowMap.set(key, row);
    });

    const importedRows = Array.from(rowMap.values()).filter((row) => row.username || row.accountId > 0 || row.student_id > 0);

    if (importedRows.length === 0) {
      return res.status(400).json({ message: 'No valid rows to import' });
    }

    const [existingAccounts] = await db.query('SELECT account_id, role, username FROM account');
    const existingIdsByRole = {
      Admin: new Set(),
      Student: new Set(),
    };
    const existingAccountsByUsername = new Map();

    const findAccountIdByStudentId = async (studentId) => {
      if (!studentId || typeof studentId !== 'number' || studentId <= 0) return null;
      const [studentRows] = await db.query('SELECT account_id FROM student WHERE student_id = ? LIMIT 1', [studentId]);
      return studentRows.length > 0 ? studentRows[0].account_id : null;
    };
    existingAccounts.forEach((row) => {
      const normalizedUsername = String(row.username || '').trim().toLowerCase();
      if (normalizedUsername) {
        existingAccountsByUsername.set(normalizedUsername, row.account_id);
      }
      const roleKey = row.role === 'Student' ? 'Student' : 'Admin';
      existingIdsByRole[roleKey].add(row.account_id);
    });

    const processedIdsByRole = {
      Admin: new Set(),
      Student: new Set(),
    };

    const upsertAccount = async (row) => {
      let accountId = row.accountId > 0 ? row.accountId : null;
      if (!accountId && row.student_id > 0) {
        const foundAccountId = await findAccountIdByStudentId(row.student_id);
        if (foundAccountId) {
          accountId = foundAccountId;
        }
      }
      if (!accountId && row.username) {
        const normalizedUsername = String(row.username).trim().toLowerCase();
        const foundAccountId = existingAccountsByUsername.get(normalizedUsername);
        if (foundAccountId) {
          accountId = foundAccountId;
        }
      }
      const existingRow = accountId ? existingAccounts.find((item) => item.account_id === accountId) : null;

      if (existingRow) {
        await db.query(
          'UPDATE account SET username = ?, role = ?, account_status = ? WHERE account_id = ?',
          [row.username, row.role, row.account_status, accountId]
        );
      } else {
        if (accountId) {
          await db.query(
            'INSERT INTO account (account_id, username, role, account_status, password) VALUES (?, ?, ?, ?, ?)',
            [accountId, row.username, row.role, row.account_status, DEFAULT_IMPORTED_USER_PASSWORD]
          );
        } else {
            const [result] = await db.query(
            'INSERT INTO account (username, role, account_status, password) VALUES (?, ?, ?, ?)',
            [row.username, row.role, row.account_status, DEFAULT_IMPORTED_USER_PASSWORD]
          );
          accountId = result.insertId;
        }
      }

      if (row.role === 'Student' && accountId) {
        const [studentRows] = await db.query('SELECT student_id FROM student WHERE account_id = ? LIMIT 1', [accountId]);
        if (studentRows.length > 0) {
          if (row.student_id > 0) {
            await db.query(
              'UPDATE student SET student_id = ?, student_name = ?, student_faculty = ?, student_major = ? WHERE account_id = ?',
              [row.student_id, row.student_name || null, row.student_faculty || null, row.student_major || null, accountId]
            );
          } else {
            await db.query(
              'UPDATE student SET student_name = ?, student_faculty = ?, student_major = ? WHERE account_id = ?',
              [row.student_name || null, row.student_faculty || null, row.student_major || null, accountId]
            );
          }
        } else {
          if (row.student_id > 0) {
            await db.query(
              'INSERT INTO student (student_id, student_name, student_faculty, student_major, account_id) VALUES (?, ?, ?, ?, ?)',
              [row.student_id, row.student_name || null, row.student_faculty || null, row.student_major || null, accountId]
            );
          } else {
            await db.query(
              'INSERT INTO student (student_name, student_faculty, student_major, account_id) VALUES (?, ?, ?, ?)',
              [row.student_name || null, row.student_faculty || null, row.student_major || null, accountId]
            );
          }
        }

        if (typeof row.internship_company_id === 'number' && row.internship_company_id > 0) {
          const [studentInfo] = await db.query('SELECT student_id FROM student WHERE account_id = ? LIMIT 1', [accountId]);
          const studentId = studentInfo.length > 0 ? studentInfo[0].student_id : null;
          if (studentId) {
            const [activeRows] = await db.query(
              'SELECT student_internship_id FROM internship_of_student WHERE student_id = ? AND (end_date IS NULL) ORDER BY student_internship_id DESC LIMIT 1',
              [studentId]
            );
            if (activeRows.length > 0) {
              await db.query(
                'UPDATE internship_of_student SET company_id = ? WHERE student_internship_id = ?',
                [row.internship_company_id, activeRows[0].student_internship_id]
              );
            } else {
              await db.query(
                'INSERT INTO internship_of_student (student_id, company_id, start_date, student_internship_status) VALUES (?, ?, NOW(), 1)',
                [studentId, row.internship_company_id]
              );
            }
          }
        }
      }

      if (row.role !== 'Student' && accountId) {
        await db.query('UPDATE student SET student_name = ? WHERE account_id = ?', [row.username || null, accountId]);
      }

      return accountId;
    };

    const deleteAccount = async (accountId) => {
      const [studentRows] = await db.query('SELECT student_id FROM student WHERE account_id = ? LIMIT 1', [accountId]);
      const studentId = studentRows.length > 0 ? studentRows[0].student_id : null;
      if (studentId) {
        await db.query('DELETE FROM quiz_result WHERE student_id = ?', [studentId]);
        await db.query('DELETE FROM career_fit_quiz WHERE student_id = ?', [studentId]);
        await db.query('DELETE FROM favorite WHERE student_id = ?', [studentId]);
        await db.query(
          'DELETE FROM review WHERE student_internship_id IN (SELECT student_internship_id FROM internship_of_student WHERE student_id = ?)',
          [studentId]
        );
        await db.query('DELETE FROM internship_of_student WHERE student_id = ?', [studentId]);
        await db.query('DELETE FROM student WHERE student_id = ?', [studentId]);
      }
      await db.query('DELETE FROM account WHERE account_id = ?', [accountId]);
    };

    for (const row of importedRows) {
      const accountId = await upsertAccount(row);
      if (accountId) {
        processedIdsByRole[row.role].add(accountId);
      }
    }

    let deletedCount = 0;
    for (const roleKey of ['Admin', 'Student']) {
      if (!importedRows.some((row) => row.role === roleKey)) continue;
      for (const existingId of existingIdsByRole[roleKey]) {
        if (!processedIdsByRole[roleKey].has(existingId)) {
          await deleteAccount(existingId);
          deletedCount++;
        }
      }
    }

    const totalCount = processedIdsByRole.Admin.size + processedIdsByRole.Student.size;
    res.json({ message: 'Users imported', updatedCount: totalCount, deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message || 'Database error' });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [studentRows] = await db.query("SELECT student_id FROM student WHERE account_id = ? LIMIT 1", [id]);
    const studentId = studentRows.length > 0 ? studentRows[0].student_id : null;

    if (studentId) {
      await db.query("DELETE FROM quiz_result WHERE student_id = ?", [studentId]);
      await db.query("DELETE FROM career_fit_quiz WHERE student_id = ?", [studentId]);
      await db.query("DELETE FROM favorite WHERE student_id = ?", [studentId]);
      await db.query(
        "DELETE FROM review WHERE student_internship_id IN (SELECT student_internship_id FROM internship_of_student WHERE student_id = ?)",
        [studentId]
      );
      await db.query("DELETE FROM internship_of_student WHERE student_id = ?", [studentId]);
      await db.query("DELETE FROM student WHERE student_id = ?", [studentId]);
    }

    await db.query("DELETE FROM account WHERE account_id = ?", [id]);

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

// ==================================================
// GET ALL POSTS
// ==================================================
app.get("/api/posts", async (req, res) => {
  try {
    const sql = `
      SELECT 
        i.internship_posts_id AS post_id,
        i.internship_title,
        i.internship_location,
        i.internship_duration,
        i.internship_description,
        i.internship_responsibilities,
        i.internship_requirements,
        i.internship_compensation,
        i.internship_working_method,
        i.internship_link,
        i.internship_create_date,
        i.internship_expired_date,
        i.internship_status,
        i.mou,
        c.company_id,
        c.company_name
      FROM internship_posts i
      JOIN company c ON i.company_id = c.company_id
    `;

    const [results] = await db.query(sql);
    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// ==================================================
// GET POST BY ID
// ==================================================
app.get("/api/posts/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const sql = `
      SELECT 
        i.internship_posts_id AS post_id,
        i.company_id,
        i.internship_title,
        i.internship_location,
        i.internship_duration,
        i.internship_description,
        i.internship_responsibilities,
        i.internship_requirements,
        i.internship_compensation,
        i.internship_working_method,
        i.internship_link,
        i.internship_status,
        i.mou,
        i.internship_expired_date,
        c.company_name
      FROM internship_posts i
      JOIN company c ON i.company_id = c.company_id
      WHERE i.internship_posts_id = ?
    `;

    const [results] = await db.query(sql, [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(results[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// ==================================================
// GET COMPANY BY ID
// ==================================================
app.get("/api/company/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const sql = "SELECT * FROM company WHERE company_id = ?";
    const [results] = await db.query(sql, [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(results[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// ==================================================
// GET POSTS BY COMPANY
// ==================================================
app.get("/api/posts/company/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        internship_posts_id AS post_id,
        internship_title,
        internship_location,
        internship_duration,
        internship_compensation,
        internship_description,
        internship_responsibilities,
        internship_requirements,
        internship_working_method,
        internship_expired_date,
        internship_status
      FROM internship_posts 
      WHERE company_id = ?
    `;

    const [results] = await db.query(sql, [id]);
    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});


// ==================================================
// GET REVIEWS (FIXED + JOIN STUDENT)
// ==================================================
app.get("/api/reviews/company/:id", async (req, res) => {
  try {
    const companyId = req.params.id;

    const sql = `
      SELECT 
        r.review_id AS review_id,
        s.student_name AS reviewer_name,   -- ✅ ชื่อผู้รีวิว
        r.review_sum_rating AS rating,     -- ✅ คะแนนรวม
        r.review_work_rating,
        r.review_life_rating,
        r.review_commu_rating,
        r.review_comment AS comment,
        r.review_date AS created_at
      FROM review r
      LEFT JOIN student s 
        ON r.student_id = s.student_id
      WHERE r.company_id = ?
      ORDER BY r.review_date DESC
    `;

    const [rows] = await db.query(sql, [companyId]);

    res.json(rows);

  } catch (err) {
    console.error("❌ GET REVIEWS ERROR:", err);
    res.status(500).json({
      error: "fetch reviews error"
    });
  }
});

// ==================================================
// CREATE REVIEW
// ==================================================
app.post("/api/reviews", async (req, res) => {
  try {
    let {
      company_id,
      student_id,
      review_sum_rating,
      review_work_rating,
      review_life_rating,
      review_commu_rating,
      review_comment
    } = req.body;

    company_id = Number(company_id);
    student_id = Number(student_id);

    const sql = `
      INSERT INTO review 
      (company_id, student_id, review_sum_rating, review_work_rating, review_life_rating, review_commu_rating, review_comment, review_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await db.query(sql, [
      company_id,
      student_id,
      review_sum_rating,
      review_work_rating,
      review_life_rating,
      review_commu_rating,
      review_comment || ""
    ]);

    res.json({
      message: "✅ Review created",
      review_id: result.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// GET QUESTIONS
// ===============================
app.get('/api/questions', async (req, res) => {
  try {
    const { positions } = req.query;

    if (!positions) {
      return res.status(400).json({ message: "positions required" });
    }
    const positionIds = positions.split(',').map(Number);
    const results = [];

    for (const pos of positionIds) {
      const [rows] = await db.query(
        `SELECT 
          question_id AS id,
          quiz_question AS question_text,
          position_id
         FROM quiz_question 
         WHERE position_id = ? 
         ORDER BY RAND() 
         LIMIT 5`,
        [pos]
      );

      results.push(...rows);
    }

    res.json(results);

  } catch (err) {
    console.error("❌ GET QUESTIONS ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
// get position for quiz
// ==================================================
app.get('/api/positions', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM position');

    const formatted = rows.map(p => ({
      id: p.position_name,
      position_id: p.position_id,
      title: p.position_name,           // ✅ ใช้ชื่อจริง
      description: p.position_description // ✅ อธิบายงาน
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================================================
// SUBMIT QUIZ (SAVE SCORE)
// ==================================================
app.post("/api/quiz/submit", async (req, res) => {
  try {
    const { student_id, positions, answers } = req.body;

    if (!student_id || !positions || !answers) {
      return res.status(400).json({ message: "missing data" });
    }

    // =========================
    // 1️⃣ CREATE QUIZ
    // =========================
    const [quizResult] = await db.query(
      `INSERT INTO career_fit_quiz 
      (student_id, position1, position2, position3)
      VALUES (?, ?, ?, ?)`,
      [student_id, positions[0], positions[1], positions[2]]
    );

    const quiz_id = quizResult.insertId;

    // =========================
    // 2️⃣ CALCULATE SCORE
    // =========================
    let scoreMap = {};

    for (const ans of answers) {
      const [q] = await db.query(
        `SELECT position_id 
         FROM quiz_question 
         WHERE question_id = ?`,
        [ans.question_id]
      );

      if (!q.length) continue;

      const pos = q[0].position_id;

      if (!scoreMap[pos]) scoreMap[pos] = 0;
      scoreMap[pos] += ans.answer;
    }

    const score1 = scoreMap[positions[0]] || 0;
    const score2 = scoreMap[positions[1]] || 0;
    const score3 = scoreMap[positions[2]] || 0;

    // =========================
    // 3️⃣ SAVE RESULT
    // =========================
    await db.query(
      `INSERT INTO quiz_result
      (student_id, quiz_id, position_skill, position1, position2, position3, score1, score2, score3, quiz_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        student_id,
        quiz_id,
        "", // กัน error NOT NULL
        positions[0],
        positions[1],
        positions[2],
        score1,
        score2,
        score3
      ]
    );

    res.json({
      message: "saved",
      quiz_id,
      score1,
      score2,
      score3
    });

  } catch (err) {
    console.error("❌ SUBMIT ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});


// ==================================================
// GET RESULT QUIZ (ล่าสุดของ user)
// ==================================================
app.get("/api/quiz/result/:student_id", async (req, res) => {
  try {
    const { student_id } = req.params;

    const [rows] = await db.query(
      `SELECT *
       FROM quiz_result
       WHERE student_id = ?
       ORDER BY quiz_date DESC
       LIMIT 1`,
      [student_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "no result" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("❌ RESULT ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});

// ==================================================
// GET POSITION BY IDS (สำหรับหน้า RESULT)
// ==================================================
app.get("/api/positions/by-ids", async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.json([]);

    const idList = ids.split(",").map(Number);
    const [rows] = await db.query(
      "SELECT * FROM position WHERE position_id IN (?)",
      [idList]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// ==================================================
// FAVORITES
// ==================================================
app.get("/api/favorites/:student_id", async (req, res) => {
  try {
    const { student_id } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM favorite WHERE student_id = ?",
      [student_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.post("/api/favorites", async (req, res) => {
  try {
    const { student_id, post_id } = req.body;
    await db.query(
      "INSERT INTO favorite (student_id, post_id) VALUES (?, ?)",
      [student_id, post_id]
    );
    res.json({ message: "added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.delete("/api/favorites", async (req, res) => {
  try {
    const { student_id, post_id } = req.body;
    await db.query(
      "DELETE FROM favorite WHERE student_id = ? AND post_id = ?",
      [student_id, post_id]
    );
    res.json({ message: "deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
