require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5002;

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
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "ICTern",
  port: process.env.DB_PORT || 3306,
});

const DEFAULT_IMPORTED_USER_PASSWORD = "123456";

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL");
    connection.release();
  }
});

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });


// ==================================================
// LOGIN
// ==================================================
app.post("/api/login", (req, res) => {

  const { email, password } = req.body;
  console.log("📨 Login request received:", { email, password });

  const sql = "SELECT * FROM account WHERE username = ?";

  db.query(sql, [email], (err, results) => {

    if (err) {
      return res.status(500).json(err);
    }

    if (results.length === 0) {
      console.log("🔍 User not found for username:", email);
      return res.status(401).json({ message: "Username หรือ Password ไม่ถูกต้อง" });
    }

    const user = results[0];
    console.log("🔍 User found:", { username: user.username, role: user.role });

    if (password !== user.password) {
      console.log("❌ Password mismatch for user:", email);
      return res.status(401).json({ message: "Username หรือ Password ไม่ถูกต้อง" });
    }

    console.log("✅ Login success for user:", email);
    res.json({
      message: "Login success",
      user: {
        id: user.account_id,
        username: user.username,
        role: user.role,
        status: user.account_status,
      },
    });

  });

});

app.get("/api/users", async (req, res) => {
  try {
    const roleParam = typeof req.query.role === 'string' ? req.query.role.toLowerCase() : 'students';
    const roleFilter = roleParam === 'admins' ? 'admins' : 'students';

    const whereClause = roleFilter === 'admins'
      ? "WHERE a.role <> 'Student'"
      : "WHERE a.role = 'Student'";

    const rows = await query(
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
    const rows = await query(
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

    const current = await query(
      "SELECT account_id, role FROM account WHERE account_id = ? LIMIT 1",
      [id]
    );
    if (!current || current.length === 0) return res.status(404).json({ message: "User not found" });

    await query(
      "UPDATE account SET username = ?, account_status = ? WHERE account_id = ?",
      [username, typeof account_status === "number" ? account_status : 1, id]
    );

    if (current[0].role === 'Student') {
      const studentRows = await query("SELECT student_id FROM student WHERE account_id = ? LIMIT 1", [id]);
      if (studentRows.length > 0) {
        const studentId = studentRows[0].student_id;
        await query(
          "UPDATE student SET student_name = ?, student_faculty = ?, student_major = ? WHERE account_id = ?",
          [student_name || null, student_faculty || null, student_major || null, id]
        );

        if (typeof internship_company_id === "number") {
          const activeRows = await query(
            "SELECT student_internship_id FROM internship_of_student WHERE student_id = ? AND (end_date IS NULL) ORDER BY student_internship_id DESC LIMIT 1",
            [studentId]
          );
          if (activeRows.length > 0) {
            await query(
              "UPDATE internship_of_student SET company_id = ? WHERE student_internship_id = ?",
              [internship_company_id, activeRows[0].student_internship_id]
            );
          } else {
            await query(
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

    const existingAccounts = await query('SELECT account_id, role, username FROM account');
    const existingIdsByRole = {
      Admin: new Set(),
      Student: new Set(),
    };
    const existingAccountsByUsername = new Map();

    const findAccountIdByStudentId = async (studentId) => {
      if (!studentId || typeof studentId !== 'number' || studentId <= 0) return null;
      const studentRows = await query('SELECT account_id FROM student WHERE student_id = ? LIMIT 1', [studentId]);
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
        await query(
          'UPDATE account SET username = ?, role = ?, account_status = ? WHERE account_id = ?',
          [row.username, row.role, row.account_status, accountId]
        );
      } else {
        if (accountId) {
          await query(
            'INSERT INTO account (account_id, username, role, account_status, password) VALUES (?, ?, ?, ?, ?)',
            [accountId, row.username, row.role, row.account_status, DEFAULT_IMPORTED_USER_PASSWORD]
          );
        } else {
            const result = await query(
            'INSERT INTO account (username, role, account_status, password) VALUES (?, ?, ?, ?)',
            [row.username, row.role, row.account_status, DEFAULT_IMPORTED_USER_PASSWORD]
          );
          accountId = result.insertId;
        }
      }

      if (row.role === 'Student' && accountId) {
        const studentRows = await query('SELECT student_id FROM student WHERE account_id = ? LIMIT 1', [accountId]);
        if (studentRows.length > 0) {
          if (row.student_id > 0) {
            await query(
              'UPDATE student SET student_id = ?, student_name = ?, student_faculty = ?, student_major = ? WHERE account_id = ?',
              [row.student_id, row.student_name || null, row.student_faculty || null, row.student_major || null, accountId]
            );
          } else {
            await query(
              'UPDATE student SET student_name = ?, student_faculty = ?, student_major = ? WHERE account_id = ?',
              [row.student_name || null, row.student_faculty || null, row.student_major || null, accountId]
            );
          }
        } else {
          if (row.student_id > 0) {
            await query(
              'INSERT INTO student (student_id, student_name, student_faculty, student_major, account_id) VALUES (?, ?, ?, ?, ?)',
              [row.student_id, row.student_name || null, row.student_faculty || null, row.student_major || null, accountId]
            );
          } else {
            await query(
              'INSERT INTO student (student_name, student_faculty, student_major, account_id) VALUES (?, ?, ?, ?)',
              [row.student_name || null, row.student_faculty || null, row.student_major || null, accountId]
            );
          }
        }

        if (typeof row.internship_company_id === 'number' && row.internship_company_id > 0) {
          const studentInfo = await query('SELECT student_id FROM student WHERE account_id = ? LIMIT 1', [accountId]);
          const studentId = studentInfo.length > 0 ? studentInfo[0].student_id : null;
          if (studentId) {
            const activeRows = await query(
              'SELECT student_internship_id FROM internship_of_student WHERE student_id = ? AND (end_date IS NULL) ORDER BY student_internship_id DESC LIMIT 1',
              [studentId]
            );
            if (activeRows.length > 0) {
              await query(
                'UPDATE internship_of_student SET company_id = ? WHERE student_internship_id = ?',
                [row.internship_company_id, activeRows[0].student_internship_id]
              );
            } else {
              await query(
                'INSERT INTO internship_of_student (student_id, company_id, start_date, student_internship_status) VALUES (?, ?, NOW(), 1)',
                [studentId, row.internship_company_id]
              );
            }
          }
        }
      }

      if (row.role !== 'Student' && accountId) {
        await query('UPDATE student SET student_name = ? WHERE account_id = ?', [row.username || null, accountId]);
      }

      return accountId;
    };

    const deleteAccount = async (accountId) => {
      const studentRows = await query('SELECT student_id FROM student WHERE account_id = ? LIMIT 1', [accountId]);
      const studentId = studentRows.length > 0 ? studentRows[0].student_id : null;
      if (studentId) {
        await query('DELETE FROM quiz_result WHERE student_id = ?', [studentId]);
        await query('DELETE FROM career_fit_quiz WHERE student_id = ?', [studentId]);
        await query('DELETE FROM favorite WHERE student_id = ?', [studentId]);
        await query(
          'DELETE FROM review WHERE student_internship_id IN (SELECT student_internship_id FROM internship_of_student WHERE student_id = ?)',
          [studentId]
        );
        await query('DELETE FROM internship_of_student WHERE student_id = ?', [studentId]);
        await query('DELETE FROM student WHERE student_id = ?', [studentId]);
      }
      await query('DELETE FROM account WHERE account_id = ?', [accountId]);
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

    const studentRows = await query("SELECT student_id FROM student WHERE account_id = ? LIMIT 1", [id]);
    const studentId = studentRows.length > 0 ? studentRows[0].student_id : null;

    if (studentId) {
      await query("DELETE FROM quiz_result WHERE student_id = ?", [studentId]);
      await query("DELETE FROM career_fit_quiz WHERE student_id = ?", [studentId]);
      await query("DELETE FROM favorite WHERE student_id = ?", [studentId]);
      await query(
        "DELETE FROM review WHERE student_internship_id IN (SELECT student_internship_id FROM internship_of_student WHERE student_id = ?)",
        [studentId]
      );
      await query("DELETE FROM internship_of_student WHERE student_id = ?", [studentId]);
      await query("DELETE FROM student WHERE student_id = ?", [studentId]);
    }

    await query("DELETE FROM account WHERE account_id = ?", [id]);

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});


// ==================================================
// GET ALL POSTS
// ==================================================
app.get("/api/posts", (req, res) => {

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
    JOIN company c
      ON i.company_id = c.company_id
  `;

  db.query(sql, (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json(results);

  });

});


// ==================================================
// GET POST BY ID
// ==================================================
app.get("/api/posts/:id", (req, res) => {

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
  JOIN company c
  ON i.company_id = c.company_id
  WHERE i.internship_posts_id = ?
  `;

  db.query(sql, [id], (err, results) => {

    if (err) {
      return res.status(500).json(err);
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(results[0]);

  });

});


// ==================================================
// ✅ GET COMPANY BY ID
// ==================================================
app.get("/api/company/:id", (req, res) => {
  const { id } = req.params;
  console.log(`📨 Request for company ID: ${id}`);
  const sql = "SELECT * FROM company WHERE company_id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      console.log(`🔍 Company not found for ID: ${id}`);
      return res.status(404).json({ message: "Company not found" });
    }

    console.log(`✅ Company found: ${results[0].company_name}`);
    res.json(results[0]);
  });
});

// ==================================================
// ✅ GET POSTS BY COMPANY ID
// ==================================================
app.get("/api/posts/company/:id", (req, res) => {
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

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ Query error:", err);
      return res.status(500).json(err);
    }
    res.json(results);
  });
});

// ==================================================
// ✅ GET ALL COMPANIES (For selection)
// ==================================================
app.get("/api/companies", (req, res) => {
  const sql = `
    SELECT 
      c.company_id,
      c.company_name,
      c.company_address,
      c.company_type,
      c.company_email,
      c.company_phone_num,
      c.company_link,
      c.company_description,
      c.company_logo,
      c.company_status,
      c.company_create_date,
      c.admin_id,
      COALESCE(COUNT(ip.internship_posts_id), 0) as total_posts
    FROM company c
    LEFT JOIN internship_posts ip ON ip.company_id = c.company_id
    GROUP BY 
      c.company_id,
      c.company_name,
      c.company_address,
      c.company_type,
      c.company_email,
      c.company_phone_num,
      c.company_link,
      c.company_description,
      c.company_logo,
      c.company_status,
      c.company_create_date,
      c.admin_id
    ORDER BY c.company_name
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// ==================================================
// ✅ CREATE COMPANY
// ==================================================
app.post("/api/companies", (req, res) => {
  const {
    company_name,
    company_address,
    company_type,
    company_email,
    company_phone_num,
    company_link,
    company_description,
    company_logo,
    company_status,
    admin_id,
    account_id
  } = req.body;

  const resolveAdminId = (cb) => {
    const candidateAccountId = account_id ?? null;
    const candidateAdminId = admin_id ?? null;
    if (candidateAccountId) {
      db.query(
        "SELECT admin_id FROM admin WHERE account_id = ? LIMIT 1",
        [candidateAccountId],
        (err, rows) => {
          if (err) return cb(err);
          if (rows.length > 0) return cb(null, rows[0].admin_id);
          return cb(null, 1);
        }
      );
      return;
    }
    if (candidateAdminId) {
      db.query(
        "SELECT admin_id FROM admin WHERE admin_id = ? LIMIT 1",
        [candidateAdminId],
        (err, rows) => {
          if (err) return cb(err);
          if (rows.length > 0) return cb(null, rows[0].admin_id);
          return cb(null, 1);
        }
      );
      return;
    }
    cb(null, 1);
  };

  resolveAdminId((err, resolvedAdminId) => {
    if (err) return res.status(500).json({ message: "Failed to resolve admin_id" });
    const sql = `
      INSERT INTO company (
        admin_id, company_name, company_address, company_type, company_email,
        company_phone_num, company_link, company_description, company_logo, company_status, company_create_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    db.query(
      sql,
      [
        resolvedAdminId,
        company_name,
        company_address || null,
        company_type || null,
        company_email || null,
        company_phone_num || null,
        company_link || null,
        company_description || null,
        company_logo || null,
        typeof company_status === "number" ? company_status : 1
      ],
      (e, result) => {
        if (e) return res.status(500).json(e);
        res.status(201).json({ message: "Company created", id: result.insertId });
      }
    );
  });
});

// ==================================================
// ✅ UPDATE COMPANY
// ==================================================
app.put("/api/companies/:id", (req, res) => {
  const { id } = req.params;
  const {
    company_name,
    company_address,
    company_type,
    company_email,
    company_phone_num,
    company_link,
    company_description,
    company_logo,
    company_status
  } = req.body;
  const sql = `
    UPDATE company SET
      company_name = ?, company_address = ?, company_type = ?, company_email = ?,
      company_phone_num = ?, company_link = ?, company_description = ?, company_logo = ?, company_status = ?
    WHERE company_id = ?
  `;
  db.query(
    sql,
    [
      company_name,
      company_address || null,
      company_type || null,
      company_email || null,
      company_phone_num || null,
      company_link || null,
      company_description || null,
      company_logo || null,
      typeof company_status === "number" ? company_status : 1,
      id
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Company updated" });
    }
  );
});

// ==================================================
// ✅ DELETE COMPANY
// ==================================================
app.delete("/api/companies/:id", (req, res) => {
  const { id } = req.params;
  // Consider foreign key constraints; if posts exist, you may want to reject
  db.query("DELETE FROM company WHERE company_id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Company deleted" });
  });
});

// ==================================================
// ✅ SIMPLE LOGO UPLOAD (base64 JSON)
// Body: { filename: string, data: "data:image/png;base64,..." }
// Returns: { url: "/uploads/<file>" }
// ==================================================
app.post("/api/uploads/logo", (req, res) => {
  try {
    const { filename, data } = req.body || {};
    if (!filename || !data) {
      return res.status(400).json({ message: "filename and data are required" });
    }
    const match = data.match(/^data:(.+);base64,(.*)$/);
    if (!match) {
      return res.status(400).json({ message: "Invalid base64 data" });
    }
    const ext = path.extname(filename) || ".png";
    if (!fs.existsSync(path.join(__dirname, "uploads"))) {
      fs.mkdirSync(path.join(__dirname, "uploads"), { recursive: true });
    }
    const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    const buffer = Buffer.from(match[2], "base64");
    const outPath = path.join(__dirname, "uploads", safeName);
    fs.writeFileSync(outPath, buffer);
    const url = `/uploads/${safeName}`;
    res.status(201).json({ url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Upload failed" });
  }
});

// ==================================================
// ✅ CREATE INTERNSHIP POST
// ==================================================
app.post("/api/posts", (req, res) => {
  const { 
    internship_title, company_id, internship_location, 
    internship_duration, internship_description, 
    internship_responsibilities, internship_requirements, 
    internship_compensation, internship_working_method,
    internship_expired_date, internship_status, internship_link,
    mou,
    admin_id,
    account_id
  } = req.body;

  const sql = `
    INSERT INTO internship_posts (
      internship_title, company_id, internship_location, 
      internship_duration, internship_description, 
      internship_responsibilities, internship_requirements, 
      internship_compensation, internship_working_method,
      internship_expired_date, internship_status, internship_link, mou,
      admin_id, internship_create_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const resolveAdminId = (cb) => {
    const candidateAccountId = account_id ?? null;
    const candidateAdminId = admin_id ?? null;

    if (candidateAccountId) {
      db.query(
        "SELECT admin_id FROM admin WHERE account_id = ? LIMIT 1",
        [candidateAccountId],
        (err, results) => {
          if (err) return cb(err);
          if (results.length > 0) return cb(null, results[0].admin_id);
          return cb(null, 1);
        }
      );
      return;
    }

    if (candidateAdminId) {
      db.query(
        "SELECT admin_id FROM admin WHERE admin_id = ? LIMIT 1",
        [candidateAdminId],
        (err, results) => {
          if (err) return cb(err);
          if (results.length > 0) return cb(null, results[0].admin_id);
          return cb(null, 1);
        }
      );
      return;
    }

    return cb(null, 1);
  };

  resolveAdminId((resolveErr, resolvedAdminId) => {
    if (resolveErr) {
      console.error(resolveErr);
      return res.status(500).json({ message: "Failed to resolve admin_id" });
    }

    db.query(
      sql,
      [
        internship_title, company_id, internship_location,
        internship_duration, internship_description,
        internship_responsibilities, internship_requirements,
        internship_compensation, internship_working_method,
        internship_expired_date, internship_status || 1, internship_link || null, mou ? 1 : 0,
        resolvedAdminId
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json(err);
        }
        res.status(201).json({ message: "Post created", id: result.insertId });
      }
    );
  });
});

// ==================================================
// ✅ UPDATE INTERNSHIP POST
// ==================================================
app.put("/api/posts/:id", (req, res) => {
  const id = req.params.id;
  const { 
    internship_title, company_id, internship_location, 
    internship_duration, internship_description, 
    internship_responsibilities, internship_requirements, 
    internship_compensation, internship_working_method,
    internship_expired_date, internship_status, internship_link, mou
  } = req.body;

  const sql = `
    UPDATE internship_posts SET 
      internship_title = ?, company_id = ?, internship_location = ?, 
      internship_duration = ?, internship_description = ?, 
      internship_responsibilities = ?, internship_requirements = ?, 
      internship_compensation = ?, internship_working_method = ?,
      internship_expired_date = ?, internship_status = ?, internship_link = ?, mou = ?
    WHERE internship_posts_id = ?
  `;

  db.query(sql, [
    internship_title, company_id, internship_location, 
    internship_duration, internship_description, 
    internship_responsibilities, internship_requirements, 
    internship_compensation, internship_working_method,
    internship_expired_date, internship_status, internship_link || null, mou ? 1 : 0, id
  ], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json({ message: "Post updated" });
  });
});

// ==================================================
// ✅ DELETE INTERNSHIP POST
// ==================================================
app.delete("/api/posts/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM internship_posts WHERE internship_posts_id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Post deleted" });
  });
});

// ==================================================
// ✅ GET DASHBOARD SUMMARY
// ==================================================
app.get("/api/dashboard/summary", (req, res) => {
  const { startDate, endDate, position, company, category, location, status } = req.query;

  const dateCondition = startDate && endDate ? " AND ip.internship_create_date BETWEEN ? AND ?" : "";
  const positionCondition = position && position !== 'all' ? " AND ip.internship_title = ?" : "";
  const companyCondition = company && company !== 'all' ? " AND c.company_name = ?" : "";
  const categoryCondition = category && category !== 'all' ? " AND c.company_type = ?" : "";
  const locationCondition = location && location !== 'all' ? " AND ip.internship_location = ?" : "";
  const statusCondition = status && status !== 'all'
    ? status === 'open'
      ? " AND (ip.internship_status = 1 OR ip.internship_status IS NULL)"
      : " AND ip.internship_status = 0"
    : "";

  const dateParams = startDate && endDate ? [startDate + " 00:00:00", endDate + " 23:59:59"] : [];
  const positionParams = position && position !== 'all' ? [position] : [];
  const companyParams = company && company !== 'all' ? [company] : [];
  const categoryParams = category && category !== 'all' ? [category] : [];
  const locationParams = location && location !== 'all' ? [location] : [];

  const postFilters = dateCondition + positionCondition + locationCondition + statusCondition;
  const companyFilters = dateCondition + positionCondition + companyCondition + categoryCondition + locationCondition + statusCondition;

  const postParams = [...dateParams, ...positionParams, ...locationParams];
  const companyParamsWithFilters = [...dateParams, ...positionParams, ...companyParams, ...categoryParams, ...locationParams];



  const queries = {
    openPosts: `SELECT COUNT(*) as count FROM internship_posts ip JOIN company c ON ip.company_id = c.company_id WHERE (ip.internship_status = 1 OR ip.internship_status IS NULL) ${postFilters}`,
    closedPosts: `SELECT COUNT(*) as count FROM internship_posts ip JOIN company c ON ip.company_id = c.company_id WHERE ip.internship_status = 0 ${postFilters}`,
    totalCompanies: `
      SELECT COUNT(DISTINCT c.company_id) as count
      FROM company c
      JOIN internship_posts ip ON c.company_id = ip.company_id
      WHERE 1=1 ${companyFilters}
    `,
    totalReviews: `SELECT COUNT(*) as count FROM review ${startDate && endDate ? " WHERE review_date BETWEEN ? AND ?" : ""}`,
    totalInterns: `SELECT COUNT(*) as count FROM student`,
    positionDistribution: `
      SELECT 
        TRIM(REPLACE(REPLACE(ip.internship_title, 'Internship', ''), 'Intern', '')) as name,
        COUNT(*) as value
      FROM internship_posts ip
      JOIN company c ON ip.company_id = c.company_id
      WHERE 1=1 ${companyFilters}
      GROUP BY name
      ORDER BY value DESC
      LIMIT 5
    `,
    barChartData: `
      SELECT COALESCE(c.company_name, 'บริษัทอื่น') as name, COUNT(ip.internship_posts_id) as value
      FROM company c
      JOIN internship_posts ip ON c.company_id = ip.company_id
      WHERE 1=1 ${companyFilters}
      GROUP BY c.company_id, c.company_name
      ORDER BY value DESC
      LIMIT 5
    `
  };

  const results = {};
  const keys = Object.keys(queries);
  let completed = 0;

  keys.forEach(key => {
    let queryParams = [];

    switch (key) {
      case 'openPosts':
      case 'closedPosts':
      case 'positionDistribution':
      case 'barChartData':
      case 'totalCompanies':
        queryParams = companyParamsWithFilters;
        break;
      case 'totalReviews':
        queryParams = dateParams;
        break;
      case 'totalInterns':
        queryParams = [];
        break;
      default:
        queryParams = [];
    }

    db.query(queries[key], queryParams, (err, rows) => {
      if (err) {
        console.error(`Error fetching ${key}:`, err);
        results[key] = key.includes('total') || key.includes('Posts') ? 0 : [];
      } else {
        results[key] = (key.includes('total') || key.includes('Posts')) ? rows[0].count : rows;
      }

      completed++;
      if (completed === keys.length) {
        res.json(results);
      }
    });
  });
});

// ==================================================
app.get("/api/dashboard/filters", (req, res) => {
  const positionQuery = "SELECT DISTINCT internship_title FROM internship_posts WHERE internship_title IS NOT NULL AND internship_title != '' ORDER BY internship_title";
  const statusOptions = [ 'all', 'open', 'closed' ];

  db.query(positionQuery, (posErr, posRows) => {
    if (posErr) {
      console.error("Error fetching position filters:", posErr);
      return res.status(500).json({ message: "Error fetching position filters" });
    }

    const positionOptions = posRows.map(row => row.internship_title);
    res.json({ positionOptions, statusOptions });
  });
});

// ==================================================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
