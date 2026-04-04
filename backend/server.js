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
        await db.query('DELETE FROM review WHERE student_id = ?', [studentId]);
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
      await db.query("DELETE FROM review WHERE student_id = ?", [studentId]);
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
// GET ALL COMPANIES
// ==================================================
app.get("/api/companies", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.*, 
        (SELECT COUNT(*) FROM internship_posts ip WHERE ip.company_id = c.company_id) as total_posts
      FROM company c
      ORDER BY c.company_id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/companies", async (req, res) => {
  try {
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

    // หา admin_id ถ้าไม่ได้ส่งมาโดยตรง แต่ส่ง account_id มา
    let finalAdminId = admin_id;
    if (!finalAdminId && account_id) {
      const [adminRows] = await db.query("SELECT admin_id FROM admin WHERE account_id = ?", [account_id]);
      if (adminRows.length > 0) {
        finalAdminId = adminRows[0].admin_id;
      }
    }

    // ถ้ายังไม่มี admin_id ให้หาตัวแรกมาใช้ก่อน (เพื่อกัน error NOT NULL)
    if (!finalAdminId) {
      const [allAdmins] = await db.query("SELECT admin_id FROM admin LIMIT 1");
      if (allAdmins.length > 0) {
        finalAdminId = allAdmins[0].admin_id;
      }
    }

    const [result] = await db.query(
      `INSERT INTO company (
        company_name, company_address, company_type, company_email, 
        company_phone_num, company_link, company_description, 
        company_logo, company_status, company_create_date, admin_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        company_name, 
        company_address || null, 
        company_type || null, 
        company_email || null, 
        company_phone_num || null, 
        company_link || null, 
        company_description || null, 
        company_logo || null, 
        company_status || 1,
        finalAdminId
      ]
    );

    res.json({ message: "Company created", company_id: result.insertId });
  } catch (err) {
    console.error("❌ CREATE COMPANY ERROR:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

app.get("/api/companies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM company WHERE company_id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Company not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.put("/api/companies/:id", async (req, res) => {
  try {
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

    await db.query(
      `UPDATE company SET 
        company_name = ?, company_address = ?, company_type = ?, 
        company_email = ?, company_phone_num = ?, company_link = ?, 
        company_description = ?, company_logo = ?, company_status = ? 
      WHERE company_id = ?`,
      [
        company_name, company_address, company_type, company_email,
        company_phone_num, company_link, company_description,
        company_logo, company_status, id
      ]
    );

    res.json({ message: "Company updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.delete("/api/companies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM company WHERE company_id = ?", [id]);
    res.json({ message: "Company deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed (Ensure no posts refer to this company)" });
  }
});

// ==================================================
// UPLOAD COMPANY LOGO (Base64)
// ==================================================
app.post("/api/uploads/logo", async (req, res) => {
  try {
    const { filename, data } = req.body;
    if (!filename || !data) {
      return res.status(400).json({ message: "Invalid upload data" });
    }

    const uploadsDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    // Extract base64 data
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: "Invalid base64 string" });
    }

    const buffer = Buffer.from(matches[2], "base64");
    const ext = path.extname(filename) || ".png";
    const newFilename = `logo_${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, newFilename);

    fs.writeFileSync(filePath, buffer);

    // Return the accessible URL
    res.json({
      url: `/uploads/${newFilename}`,
      message: "Upload successful"
    });

  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// ==================================================
// UPLOAD POSTER (Base64)
// ==================================================
app.post("/api/uploads/poster", async (req, res) => {
  try {
    const { filename, data } = req.body;
    if (!filename || !data) {
      return res.status(400).json({ message: "Invalid upload data" });
    }

    const uploadsDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: "Invalid base64 string" });
    }

    const buffer = Buffer.from(matches[2], "base64");
    const ext = path.extname(filename) || ".png";
    const newFilename = `poster_${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, newFilename);

    fs.writeFileSync(filePath, buffer);

    res.json({
      url: `/uploads/${newFilename}`,
      message: "Upload successful"
    });

  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// ==================================================
// DASHBOARD
// ==================================================
app.get("/api/dashboard/summary", async (req, res) => {
  try {
    const { startDate, endDate, position } = req.query;
    // position can be a string or an array of strings
    const positions = Array.isArray(position) ? position : (position ? [position] : []);
    const isFiltered = positions.length > 0 && !positions.includes('all');
    
    // Helper to build WHERE clause for multiple positions using LIKE
    const buildPositionFilter = (tableAlias, columnName, params) => {
      if (!isFiltered) return "";
      const conditions = positions.map(() => `${tableAlias ? tableAlias + '.' : ''}${columnName} LIKE CONCAT('%', ?, '%')`);
      params.push(...positions);
      return ` AND (${conditions.join(' OR ')})`;
    };

    // 1. Open/Closed Posts (Filtered by Date and Position)
    let postsSql = "SELECT internship_status, COUNT(*) as count FROM internship_posts WHERE 1=1";
    let postsParams = [];
    if (startDate && endDate) {
        postsSql += " AND internship_create_date BETWEEN ? AND ?";
        postsParams.push(startDate, endDate);
    }
    postsSql += buildPositionFilter(null, 'internship_title', postsParams);
    
    postsSql += " GROUP BY internship_status";
    const [postStats] = await db.query(postsSql, postsParams);
    
    let openPosts = 0;
    let closedPosts = 0;
    if (Array.isArray(postStats)) {
      postStats.forEach(stat => {
          if (Number(stat.internship_status) === 1) openPosts = Number(stat.count);
          else if (Number(stat.internship_status) === 0) closedPosts = Number(stat.count);
      });
    }

    // 2. Total Companies (Filtered by Position if provided)
    let companySql = "SELECT COUNT(DISTINCT company_id) as count FROM company c";
    let companyParams = [];
    if (isFiltered) {
        companySql = "SELECT COUNT(DISTINCT company_id) as count FROM internship_posts WHERE 1=1";
        companySql += buildPositionFilter(null, 'internship_title', companyParams);
    }
    const [companies] = await db.query(companySql, companyParams);
    
    // 3. Total Reviews (Filtered by Position if provided)
    let reviewSql = "SELECT COUNT(*) as count FROM review";
    let reviewParams = [];
    if (isFiltered) {
        reviewSql = `
            SELECT COUNT(DISTINCT r.review_id) as count 
            FROM review r
            JOIN internship_posts ip ON r.company_id = ip.company_id
            WHERE 1=1
        `;
        reviewSql += buildPositionFilter('ip', 'internship_title', reviewParams);
    }
    const [reviews] = await db.query(reviewSql, reviewParams);
    
    // 4. Total Interns (Filtered by Position if provided)
    let internsSql = "SELECT COUNT(DISTINCT student_id) as count FROM internship_of_student WHERE end_date IS NULL";
    let internsParams = [];
    if (isFiltered) {
        internsSql = `
            SELECT COUNT(DISTINCT ios.student_id) as count 
            FROM internship_of_student ios
            JOIN internship_posts ip ON ios.company_id = ip.company_id
            WHERE ios.end_date IS NULL
        `;
        internsSql += buildPositionFilter('ip', 'internship_title', internsParams);
    }
    const [interns] = await db.query(internsSql, internsParams);

    // 5. Position Distribution
    let posDistSql = `
        SELECT p.position_name as name, COUNT(ip.internship_posts_id) as value 
        FROM \`position\` p
        LEFT JOIN internship_posts ip ON ip.internship_title LIKE CONCAT('%', p.position_name, '%')
        WHERE 1=1
    `;
    let posDistParams = [];
    if (startDate && endDate) {
        posDistSql += " AND ip.internship_create_date BETWEEN ? AND ?";
        posDistParams.push(startDate, endDate);
    }
    if (isFiltered) {
        const placeholders = positions.map(() => '?').join(',');
        posDistSql += ` AND p.position_name IN (${placeholders})`;
        posDistParams.push(...positions);
    }
    posDistSql += " GROUP BY p.position_name HAVING value > 0";
    const [posDist] = await db.query(posDistSql, posDistParams);

    // 6. Bar Chart Data (Posts per company - Filtered by Position)
    let barSql = `
        SELECT c.company_name as name, COUNT(ip.internship_posts_id) as value 
        FROM company c
        LEFT JOIN internship_posts ip ON c.company_id = ip.company_id 
        WHERE 1=1
    `;
    let barParams = [];
    if (startDate && endDate) {
        barSql += " AND ip.internship_create_date BETWEEN ? AND ?";
        barParams.push(startDate, endDate);
    }
    barSql += buildPositionFilter('ip', 'internship_title', barParams);
    barSql += " GROUP BY c.company_id HAVING value > 0 LIMIT 10";
    const [barData] = await db.query(barSql, barParams);

    res.json({
      openPosts,
      closedPosts,
      totalCompanies: Number(companies[0]?.count || 0),
      totalReviews: Number(reviews[0]?.count || 0),
      totalInterns: Number(interns[0]?.count || 0),
      positionDistribution: posDist || [],
      barChartData: barData || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/api/dashboard/filters", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT position_name FROM `position`");
    res.json({ positionOptions: rows.map(r => r.position_name) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// ==================================================
// POSITIONS MANAGEMENT (ADMIN)
// ==================================================
app.get("/api/admin/positions", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM `position` ORDER BY position_id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/admin/positions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [posRows] = await db.query("SELECT * FROM `position` WHERE position_id = ?", [id]);
    if (posRows.length === 0) return res.status(404).json({ message: "Position not found" });

    const [qRows] = await db.query("SELECT * FROM quiz_question WHERE position_id = ?", [id]);
    res.json({
      ...posRows[0],
      questions: qRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/admin/positions", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { position_name, position_description, position_skill, questions } = req.body;
    const trimmedName = (position_name || "").trim();
    const trimmedDescription = (position_description || "").trim();
    const trimmedSkill = (position_skill || "").trim();
    const normalizedQuestions = Array.isArray(questions)
      ? questions.map((q) => (q || "").trim()).filter(Boolean).slice(0, 5)
      : [];

    if (!trimmedName) {
      await connection.rollback();
      return res.status(400).json({ message: "กรุณาระบุชื่อตำแหน่งงาน" });
    }

    // 🔥 Check duplicate position name
    const [existing] = await connection.query(
      "SELECT position_id FROM `position` WHERE position_name = ?",
      [trimmedName]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "ตำแหน่งงานนี้มีในระบบแล้ว" });
    }

    const [result] = await connection.query(
      "INSERT INTO `position` (position_name, position_description, position_skill) VALUES (?, ?, ?)",
      [trimmedName, trimmedDescription, trimmedSkill]
    );
    const position_id = result.insertId;

    if (normalizedQuestions.length > 0) {
      for (const q of normalizedQuestions) {
        await connection.query(
          "INSERT INTO quiz_question (quiz_question, position_id) VALUES (?, ?)",
          [q, position_id]
        );
      }
    }

    await connection.commit();
    res.json({ message: "Position created", position_id });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Database error" });
  } finally {
    connection.release();
  }
});

app.put("/api/admin/positions/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { position_name, position_description, position_skill, questions } = req.body;
    const trimmedName = (position_name || "").trim();
    const trimmedDescription = (position_description || "").trim();
    const trimmedSkill = (position_skill || "").trim();
    const normalizedQuestions = Array.isArray(questions)
      ? questions.map((q) => (q || "").trim()).filter(Boolean).slice(0, 5)
      : [];

    if (!trimmedName) {
      await connection.rollback();
      return res.status(400).json({ message: "กรุณาระบุชื่อตำแหน่งงาน" });
    }

    await connection.query(
      "UPDATE `position` SET position_name = ?, position_description = ?, position_skill = ? WHERE position_id = ?",
      [trimmedName, trimmedDescription, trimmedSkill, id]
    );

    // Delete old questions and insert new ones (simpler than update)
    await connection.query("DELETE FROM quiz_question WHERE position_id = ?", [id]);

    if (normalizedQuestions.length > 0) {
      for (const q of normalizedQuestions) {
        await connection.query(
          "INSERT INTO quiz_question (quiz_question, position_id) VALUES (?, ?)",
          [q, id]
        );
      }
    }

    await connection.commit();
    res.json({ message: "Position updated" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Database error" });
  } finally {
    connection.release();
  }
});

app.delete("/api/admin/positions/:id", async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // Delete associated quiz questions first
    await connection.query("DELETE FROM quiz_question WHERE position_id = ?", [id]);
    
    // Delete from quiz_result and career_fit_quiz might be needed if there are foreign keys
    // but usually we might want to keep historical results or restrict deletion
    // For now, let's assume cascade or simple delete
    await connection.query("DELETE FROM `position` WHERE position_id = ?", [id]);

    await connection.commit();
    res.json({ message: "Position deleted" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Database error (Ensure no active quiz results depend on this position)" });
  } finally {
    connection.release();
  }
});

// ==================================================
// GET ALL POSTS
// ==================================================
app.get("/api/posts", async (req, res) => {
  try {
    // 🔥 Auto-update expired posts before fetching
    await updateExpiredPosts();

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
        i.internship_apply_type,
        i.internship_poster,
        i.internship_create_date,
        i.internship_expired_date,
        i.internship_status,
        i.mou,
        c.company_id,
        c.company_name,
        c.company_logo,

        -- 🔥 ตัวนี้แหละสำคัญ
        ROUND(AVG(r.review_sum_rating),1) AS rating,
        COUNT(r.review_id) AS review_count

      FROM internship_posts i
      JOIN company c ON i.company_id = c.company_id
      LEFT JOIN review r ON c.company_id = r.company_id

      GROUP BY i.internship_posts_id
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
        i.internship_apply_type,
        i.internship_poster,
        i.internship_status,
        i.mou,
        i.internship_expired_date,
        c.company_name,
        c.company_logo
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
// GET POST DETAIL + COMPANY RATING
// ==================================================
app.get('/api/posts/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`
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
        i.internship_apply_type,
        i.internship_poster,
        i.internship_expired_date,

        c.company_id,
        c.company_name,

        -- 🔥 rating บริษัท
        ROUND(AVG(r.review_sum_rating),1) AS rating,
        COUNT(r.review_id) AS review_count

      FROM internship_posts i
      JOIN company c ON i.company_id = c.company_id
      LEFT JOIN review r ON c.company_id = r.company_id

      WHERE i.internship_posts_id = ?

      GROUP BY i.internship_posts_id
    `, [id]);

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
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

    // ตรวจสอบว่ามีคอลัมน์ student_internship_id หรือไม่จาก schema ที่เรา probe มาคือไม่มี
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
    console.error("❌ CREATE REVIEW ERROR:", err);
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
           AND TRIM(COALESCE(quiz_question, '')) <> ''
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
    const [rows] = await db.query(`
      SELECT
        p.position_id,
        p.position_name,
        p.position_description
      FROM \`position\` p
      WHERE TRIM(COALESCE(p.position_name, '')) <> ''
        AND TRIM(COALESCE(p.position_description, '')) <> ''
        AND TRIM(COALESCE(p.position_skill, '')) <> ''
        AND (
          SELECT COUNT(*)
          FROM quiz_question qq
          WHERE qq.position_id = p.position_id
            AND TRIM(COALESCE(qq.quiz_question, '')) <> ''
        ) >= 5
      ORDER BY p.position_name ASC
    `);

    const formatted = rows.map(p => ({
      id: p.position_name,
      position_id: p.position_id,
      title: p.position_name,
      description: p.position_description
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
      "SELECT * FROM `position` WHERE position_id IN (?)",
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

// ==================================================
// CREATE/UPDATE/DELETE POSTS (ADMIN)
// ==================================================
app.post("/api/posts", async (req, res) => {
  try {
    const {
      internship_title,
      company_id,
      internship_working_method,
      internship_duration,
      internship_location,
      internship_compensation,
      internship_description,
      internship_responsibilities,
      internship_requirements,
      internship_expired_date,
      internship_link,
      internship_apply_type,
      internship_poster,
      internship_status,
      mou,
      account_id
    } = req.body;

    let finalAdminId = null;
    if (account_id) {
      const [adminRows] = await db.query("SELECT admin_id FROM admin WHERE account_id = ?", [account_id]);
      if (adminRows.length > 0) {
        finalAdminId = adminRows[0].admin_id;
      }
    }

    if (!finalAdminId) {
      const [allAdmins] = await db.query("SELECT admin_id FROM admin LIMIT 1");
      if (allAdmins.length > 0) {
        finalAdminId = allAdmins[0].admin_id;
      }
    }

    const [result] = await db.query(
      `INSERT INTO internship_posts (
        internship_title, company_id, internship_working_method, 
        internship_duration, internship_location, internship_compensation, 
        internship_description, internship_responsibilities, 
        internship_requirements, internship_expired_date, 
        internship_link, internship_apply_type, internship_poster, internship_status, mou, admin_id, internship_create_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        internship_title, company_id, internship_working_method,
        internship_duration, internship_location, internship_compensation,
        internship_description, internship_responsibilities,
        internship_requirements, internship_expired_date || null,
        internship_link, internship_apply_type || 'link', internship_poster || null, internship_status ?? 1, mou ?? 0, finalAdminId
      ]
    );

    res.json({ message: "Post created", post_id: result.insertId });

    // 🔥 Auto-update expired posts after creation
    await updateExpiredPosts();
  } catch (err) {
    console.error("❌ CREATE POST ERROR:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

app.put("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      internship_title,
      company_id,
      internship_working_method,
      internship_duration,
      internship_location,
      internship_compensation,
      internship_description,
      internship_responsibilities,
      internship_requirements,
      internship_expired_date,
      internship_link,
      internship_apply_type,
      internship_poster,
      internship_status,
      mou
    } = req.body;

    await db.query(
      `UPDATE internship_posts SET 
        internship_title = ?, company_id = ?, internship_working_method = ?, 
        internship_duration = ?, internship_location = ?, internship_compensation = ?, 
        internship_description = ?, internship_responsibilities = ?, 
        internship_requirements = ?, internship_expired_date = ?, 
        internship_link = ?, internship_apply_type = ?, internship_poster = ?, internship_status = ?, mou = ? 
      WHERE internship_posts_id = ?`,
      [
        internship_title, company_id, internship_working_method,
        internship_duration, internship_location, internship_compensation,
        internship_description, internship_responsibilities,
        internship_requirements, internship_expired_date || null,
        internship_link, internship_apply_type || 'link', internship_poster || null, internship_status, mou, id
      ]
    );

    res.json({ message: "Post updated" });

    // 🔥 Auto-update expired posts after update
    await updateExpiredPosts();
  } catch (err) {
    console.error("❌ UPDATE POST ERROR:", err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

app.delete("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM internship_posts WHERE internship_posts_id = ?", [id]);
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("❌ DELETE POST ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

const updateExpiredPosts = require('./updateExpiredPosts');

// Run the update function once on startup
updateExpiredPosts();

// Schedule the update function to run daily (e.g., every 24 hours)
setInterval(updateExpiredPosts, 24 * 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
