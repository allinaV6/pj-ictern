const express = require("express");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

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

  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "ictern",
  port: process.env.DB_PORT || 3306,
});

const DEFAULT_IMPORTED_USER_PASSWORD = "1234";

const normalizePhone = (value) => String(value || "").replace(/[\s()-]/g, "").trim();
const normalizeCompanyName = (value) => String(value || "").trim().replace(/\s+/g, " ");
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
const isValidPhone = (value) => /^(?:0\d{8,9}|\+66\d{8,9})$/.test(normalizePhone(value));
const isValidHttpUrl = (value) => {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const ensureStudentInternshipPostsNameColumn = async () => {
  const [columns] = await db.query("SHOW COLUMNS FROM internship_of_student LIKE 'student_internship_posts_name'");
  if (columns.length === 0) {
    await db.query(
      "ALTER TABLE internship_of_student ADD COLUMN student_internship_posts_name VARCHAR(255) DEFAULT NULL AFTER company_id"
    );
    console.log('✅ Added column student_internship_posts_name to internship_of_student');
  }
};

const ensureReviewInternshipPositionColumn = async () => {
  const [columns] = await db.query("SHOW COLUMNS FROM review LIKE 'review_internship_position_title'");
  if (columns.length === 0) {
    await db.query(
      "ALTER TABLE review ADD COLUMN review_internship_position_title VARCHAR(255) DEFAULT NULL AFTER student_id"
    );
    console.log('✅ Added column review_internship_position_title to review');
  }
};



// test connection
(async () => {
  try {
    const conn = await db.getConnection();
    console.log("✅ Connected to MySQL");
    conn.release();

    try {
      await ensureStudentInternshipPostsNameColumn();
      await ensureReviewInternshipPositionColumn();
    } catch (schemaErr) {
      console.error('❌ Failed to ensure schema columns:', schemaErr);
    }
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
// GET ADMINS
// ==================================================
app.get("/api/admins", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT admin_id, admin_name, email FROM admin WHERE admin_status = 'active' ORDER BY admin_name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// ==================================================
// SEND NOTIFICATION
// ==================================================
app.post("/api/notifications/send", async (req, res) => {
  try {
    const { admin_id, user_id, user_name, message } = req.body;

    if (!admin_id || !message) {
      return res.status(400).json({ error: "missing data" });
    }

    // สร้างการแจ้งเตือนเก็บไว้ (ถ้ามีตาราง notification)
    // ตอนนี้แค่ return success ลองเพิ่มตาราง notification ทีหลัง
    
    res.json({
      message: "notification sent",
      admin_id,
      user_id,
      user_name,
      notification_message: message
    });
  } catch (err) {
    console.error(err);
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

    let rows = [];

    if (roleFilter === 'admins') {
      const [adminRows] = await db.query(
        `
        SELECT
          ad.admin_id,
          a.account_id,
          COALESCE(ad.admin_name, a.username) AS username,
          ad.admin_name,
          ad.email,
          a.role,
          a.account_status,
          NULL AS student_id,
          NULL AS student_name,
          NULL AS student_faculty,
          NULL AS student_major,
          NULL AS internship_company_id,
          NULL AS internship_company_name
        FROM admin ad
        LEFT JOIN account a ON ad.account_id = a.account_id
        ORDER BY ad.admin_id DESC, a.account_id DESC
        `
      );
      rows = adminRows;
    } else {
      const [studentRows] = await db.query(
        `
        SELECT
          NULL AS admin_id,
          a.account_id,
          COALESCE(a.username, s.student_name) AS username,
          COALESCE(a.role, 'Student') AS role,
          a.account_status,
          s.student_id,
          s.student_name,
          s.email,
          s.student_faculty,
          s.student_major,
          ios.company_id as internship_company_id,
          ios.student_internship_posts_name as internship_position_title,
          c.company_name as internship_company_name
        FROM student s
        LEFT JOIN account a ON a.account_id = s.account_id
        LEFT JOIN (
          SELECT t.student_id, t.company_id, t.student_internship_posts_name
          FROM internship_of_student t
          JOIN (
            SELECT student_id, MAX(student_internship_id) AS max_id
            FROM internship_of_student
            GROUP BY student_id
          ) x
            ON x.student_id = t.student_id AND x.max_id = t.student_internship_id
        ) ios ON ios.student_id = s.student_id
        LEFT JOIN company c ON c.company_id = ios.company_id
        ORDER BY s.student_id DESC
        `
      );
      rows = studentRows;
    }

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
        ad.admin_id,
        a.account_id,
        COALESCE(ad.admin_name, a.username) AS username,
        ad.admin_name,
        COALESCE(NULLIF(TRIM(s.email), ''), NULLIF(TRIM(ad.email), '')) AS email,
        a.role,
        a.account_status,
        s.student_id,
        s.student_name,
        s.student_faculty,
        s.student_major,
        ios.company_id as internship_company_id,
        ios.student_internship_posts_name as internship_position_title,
        c.company_name as internship_company_name
      FROM account a
      LEFT JOIN admin ad ON ad.account_id = a.account_id
      LEFT JOIN student s ON s.account_id = a.account_id
      LEFT JOIN (
        SELECT t.student_id, t.company_id, t.student_internship_posts_name
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

    if (rows && rows.length > 0) {
      return res.json(rows[0]);
    }

    const [studentRows] = await db.query(
      `
      SELECT
        NULL AS admin_id,
        a.account_id,
        COALESCE(a.username, s.student_name) AS username,
        COALESCE(a.role, 'Student') AS role,
        a.account_status,
        s.student_id,
        s.student_name,
        s.email AS email,
        s.student_faculty,
        s.student_major,
        ios.company_id as internship_company_id,
        ios.student_internship_posts_name as internship_position_title,
        c.company_name as internship_company_name
      FROM student s
      LEFT JOIN account a ON a.account_id = s.account_id
      LEFT JOIN (
        SELECT t.student_id, t.company_id, t.student_internship_posts_name
        FROM internship_of_student t
        JOIN (
          SELECT student_id, company_id, MAX(student_internship_id) AS max_id
          FROM internship_of_student
          GROUP BY student_id, company_id
        ) x
          ON x.student_id = t.student_id AND x.company_id = t.company_id AND x.max_id = t.student_internship_id
      ) ios ON ios.student_id = s.student_id
      LEFT JOIN company c ON c.company_id = ios.company_id
      WHERE s.student_id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!studentRows || studentRows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(studentRows[0]);
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
      email,
      student_faculty,
      student_major,
      internship_company_id,
      internship_position_title
    } = req.body;

    const [current] = await db.query(
      "SELECT account_id, role FROM account WHERE account_id = ? LIMIT 1",
      [id]
    );

    const [studentByIdRows] = await db.query(
      "SELECT student_id, account_id FROM student WHERE student_id = ? LIMIT 1",
      [id]
    );

    const existingStudent = studentByIdRows.length > 0 ? studentByIdRows[0] : null;
    const existingAccountId = current.length > 0 ? Number(current[0].account_id) : null;
    const effectiveAccountId = existingAccountId || (existingStudent?.account_id ? Number(existingStudent.account_id) : null);

    if ((current.length === 0) && !existingStudent) return res.status(404).json({ message: "User not found" });

    const isStudentRecord = current.length > 0 ? current[0].role === 'Student' : true;

    if (isStudentRecord) {
      let accountIdToUse = effectiveAccountId;
      if (!accountIdToUse) {
        const fallbackUsername = String(username || student_name || existingStudent?.student_id || '').trim() || `student_${id}`;
        const [insertResult] = await db.query(
          "INSERT INTO account (username, role, account_status, password) VALUES (?, 'Student', ?, ?)",
          [fallbackUsername, typeof account_status === 'number' ? account_status : 1, DEFAULT_IMPORTED_USER_PASSWORD]
        );
        accountIdToUse = insertResult.insertId;
        if (existingStudent) {
          await db.query('UPDATE student SET account_id = ? WHERE student_id = ?', [accountIdToUse, existingStudent.student_id]);
        }
      }

      await db.query(
        "UPDATE account SET username = ?, account_status = ? WHERE account_id = ?",
        [username || student_name || `student_${id}`, typeof account_status === "number" ? account_status : 1, accountIdToUse]
      );

      const [studentRows] = await db.query("SELECT student_id FROM student WHERE account_id = ? LIMIT 1", [accountIdToUse]);
      const normalizedStudentEmailInput = String(email || '').trim();

      const resolveStudentEmail = (fallbackStudentId) => {
        if (normalizedStudentEmailInput) return normalizedStudentEmailInput;
        if (isValidEmail(username)) return String(username).trim();
        if (fallbackStudentId) return `${fallbackStudentId}@student.local`;
        return `${accountIdToUse}@student.local`;
      };

      if (studentRows.length > 0) {
        const studentId = studentRows[0].student_id;
        const finalStudentEmail = resolveStudentEmail(studentId);
        if (!isValidEmail(finalStudentEmail)) {
          return res.status(400).json({ message: 'รูปแบบอีเมลนักศึกษาไม่ถูกต้อง' });
        }

        await db.query(
          "UPDATE student SET student_name = ?, student_faculty = ?, student_major = ?, email = ? WHERE student_id = ?",
          [student_name || null, student_faculty || null, student_major || null, finalStudentEmail, studentId]
        );

        const selectedCompanyId = typeof internship_company_id === 'number' && internship_company_id > 0
          ? internship_company_id
          : null;
        const selectedPositionTitle = typeof internship_position_title === 'string'
          ? internship_position_title.trim()
          : '';

        if (selectedPositionTitle && !selectedCompanyId) {
          return res.status(400).json({ message: 'กรุณาเลือกบริษัทฝึกงานก่อนเลือกตำแหน่งฝึกงาน' });
        }

        if (selectedCompanyId && selectedPositionTitle) {
          const [positionRows] = await db.query(
            `SELECT internship_posts_id
             FROM internship_posts
             WHERE company_id = ?
               AND internship_status = 1
               AND TRIM(COALESCE(internship_title, '')) = TRIM(?)
             LIMIT 1`,
            [selectedCompanyId, selectedPositionTitle]
          );

          if (positionRows.length === 0) {
            return res.status(400).json({ message: 'ตำแหน่งฝึกงานที่เลือกไม่ตรงกับโพสต์ของบริษัทนี้' });
          }
        }

        const [activeRows] = await db.query(
          "SELECT student_internship_id FROM internship_of_student WHERE student_id = ? ORDER BY student_internship_id DESC LIMIT 1",
          [studentId]
        );

        if (selectedCompanyId || selectedPositionTitle) {
          if (activeRows.length > 0) {
            await db.query(
              "UPDATE internship_of_student SET company_id = ?, student_internship_posts_name = ? WHERE student_internship_id = ?",
              [selectedCompanyId, selectedPositionTitle || null, activeRows[0].student_internship_id]
            );
          } else {
            await db.query(
              "INSERT INTO internship_of_student (student_id, company_id, student_internship_posts_name, student_internship_status) VALUES (?, ?, ?, 1)",
              [studentId, selectedCompanyId, selectedPositionTitle || null]
            );
          }
        }
      } else {
        const fallbackStudentId = existingStudent?.student_id ? Number(existingStudent.student_id) : null;
        const finalStudentEmail = resolveStudentEmail(fallbackStudentId);
        if (!isValidEmail(finalStudentEmail)) {
          return res.status(400).json({ message: 'รูปแบบอีเมลนักศึกษาไม่ถูกต้อง' });
        }

        await db.query(
          "INSERT INTO student (student_id, student_name, student_faculty, student_major, email, account_id) VALUES (?, ?, ?, ?, ?, ?)",
          [fallbackStudentId || null, student_name || null, student_faculty || null, student_major || null, finalStudentEmail, accountIdToUse]
        );
      }
    } else {
      const adminDisplayName = String(student_name || username || '').trim();
      const normalizedAdminEmail = String(email || '').trim();

      if (normalizedAdminEmail && !isValidEmail(normalizedAdminEmail)) {
        return res.status(400).json({ message: 'รูปแบบอีเมลผู้ดูแลระบบไม่ถูกต้อง' });
      }

      await db.query(
        "UPDATE account SET account_status = ? WHERE account_id = ?",
        [typeof account_status === "number" ? account_status : 1, id]
      );

      const [adminExistsRows] = await db.query(
        'SELECT admin_id FROM admin WHERE account_id = ? LIMIT 1',
        [id]
      );

      if (adminExistsRows.length > 0) {
        await db.query(
          "UPDATE admin SET admin_name = ?, email = ? WHERE account_id = ?",
          [adminDisplayName || null, normalizedAdminEmail || null, id]
        );
      } else {
        await db.query(
          'INSERT INTO admin (account_id, admin_name, email) VALUES (?, ?, ?)',
          [id, adminDisplayName || null, normalizedAdminEmail || null]
        );
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
      const normalizePossibleEmail = (value) => {
        const text = String(value || '').trim();
        if (!text || text === '-' || text.toLowerCase() === 'null') return '';
        return text;
      };

      return {
        accountId,
        role,
        username,
        account_status,
        student_id: studentId,
        student_name: String(getValue('Name', 'name', 'student_name', 'ชื่อ-นามสกุล', 'ชื่อ') || '').trim(),
        email: normalizePossibleEmail(getValue('Email', 'email', 'อีเมล')),
        student_faculty: String(getValue('Faculty', 'faculty', 'คณะ') || '').trim(),
        student_major: String(getValue('Major', 'major', 'สาขา', 'Program', 'program') || '').trim(),
        internship_company_id: Number(getValue('Internship Company ID', 'internship_company_id', 'รหัสบริษัทฝึกงาน') || 0) || null,
      };
    });

    const rowMap = new Map();
    normalizedRows.forEach((row) => {
      let key = '';
      if (row.role === 'Student' && row.student_id > 0) {
        key = `student:${row.student_id}`;
      } else if (row.accountId > 0) {
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

    const invalidStudentRows = importedRows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.role === 'Student' && !(Number(row.student_id) > 0));

    if (invalidStudentRows.length > 0) {
      return res.status(400).json({
        message: 'ข้อมูลนักศึกษาไม่ถูกต้อง: ผู้ที่จะอยู่ในตาราง student ต้องมี student_id และ role = Student',
        details: invalidStudentRows.slice(0, 20).map(({ index }) => `row ${index + 1}: missing/invalid student_id for role Student`),
      });
    }

    const [existingAccounts] = await db.query('SELECT account_id, role, username FROM account');
    const [existingAdminRows] = await db.query('SELECT account_id, email FROM admin');
    const existingIdsByRole = {
      Admin: new Set(),
      Student: new Set(),
    };
    const existingAccountsByUsername = new Map();
    const existingAdminAccountByEmail = new Map();

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

    existingAdminRows.forEach((row) => {
      const normalizedEmail = String(row.email || '').trim().toLowerCase();
      if (normalizedEmail) {
        existingAdminAccountByEmail.set(normalizedEmail, row.account_id);
      }
    });

    const processedIdsByRole = {
      Admin: new Set(),
      Student: new Set(),
    };

    const upsertAccount = async (row) => {
      let accountId = null;

      if (row.role === 'Student') {
        // Student import identity is based on student_id only.
        if (row.student_id > 0) {
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
      } else {
        // Admin import identity prefers email (unique) then falls back to account_id/username.
        const normalizedAdminEmail = String(row.email || '').trim().toLowerCase();
        const emailMatchedAccountId = normalizedAdminEmail
          ? existingAdminAccountByEmail.get(normalizedAdminEmail)
          : null;

        accountId = emailMatchedAccountId || (row.accountId > 0 ? row.accountId : null);
        if (!accountId && row.username) {
          const normalizedUsername = String(row.username).trim().toLowerCase();
          const foundAccountId = existingAccountsByUsername.get(normalizedUsername);
          if (foundAccountId) {
            accountId = foundAccountId;
          }
        }
      }

      const existingRow = accountId ? existingAccounts.find((item) => item.account_id === accountId) : null;

      if (existingRow) {
        if (row.role === 'Student') {
          await db.query(
            'UPDATE account SET username = ?, role = ?, account_status = ? WHERE account_id = ?',
            [row.username, row.role, row.account_status, accountId]
          );
        } else {
          await db.query(
            'UPDATE account SET role = ?, account_status = ? WHERE account_id = ?',
            [row.role, row.account_status, accountId]
          );
        }
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
        if (!(Number(row.student_id) > 0)) {
          throw new Error(`Invalid student_id for Student role (account ${accountId || 'new'})`);
        }

        const [studentRows] = await db.query('SELECT student_id, email FROM student WHERE account_id = ? LIMIT 1', [accountId]);

        const resolveStudentEmail = (studentId, existingEmail = '') => {
          const normalizedInputEmail = String(row.email || '').trim();
          if (normalizedInputEmail && isValidEmail(normalizedInputEmail)) return normalizedInputEmail;

          if (existingEmail && isValidEmail(existingEmail)) return existingEmail;
          if (isValidEmail(row.username)) return String(row.username).trim();
          const fallbackId = studentId || accountId || Date.now();
          return `${fallbackId}@student.local`;
        };

        if (studentRows.length > 0) {
          const currentStudentId = studentRows[0].student_id;
          const currentEmail = studentRows[0].email;
          const nextStudentId = row.student_id > 0 ? row.student_id : currentStudentId;
          const nextEmail = resolveStudentEmail(nextStudentId, currentEmail);

          await db.query(
            'UPDATE student SET student_id = ?, student_name = ?, student_faculty = ?, student_major = ?, email = ? WHERE account_id = ?',
            [row.student_id, row.student_name || null, row.student_faculty || null, row.student_major || null, nextEmail, accountId]
          );
        } else {
          let reusedExistingStudentById = false;
          const [existingByStudentId] = await db.query(
            'SELECT student_id FROM student WHERE student_id = ? LIMIT 1',
            [row.student_id]
          );

          if (existingByStudentId.length > 0) {
            const nextEmail = resolveStudentEmail(row.student_id);
            await db.query(
              'UPDATE student SET account_id = ?, student_name = ?, student_faculty = ?, student_major = ?, email = ? WHERE student_id = ?',
              [accountId, row.student_name || null, row.student_faculty || null, row.student_major || null, nextEmail, row.student_id]
            );
            reusedExistingStudentById = true;
          }

          if (reusedExistingStudentById) {
            // Student row already existed with this student_id; linked it to the account above.
          } else {
          const nextEmail = resolveStudentEmail(row.student_id);

          await db.query(
            'INSERT INTO student (student_id, student_name, student_faculty, student_major, email, account_id) VALUES (?, ?, ?, ?, ?, ?)',
            [row.student_id, row.student_name || null, row.student_faculty || null, row.student_major || null, nextEmail, accountId]
          );
          }
        }

        if (typeof row.internship_company_id === 'number' && row.internship_company_id > 0) {
          const [studentInfo] = await db.query('SELECT student_id FROM student WHERE account_id = ? LIMIT 1', [accountId]);
          const studentId = studentInfo.length > 0 ? studentInfo[0].student_id : null;
          if (studentId) {
            const [activeRows] = await db.query(
              'SELECT student_internship_id FROM internship_of_student WHERE student_id = ? ORDER BY student_internship_id DESC LIMIT 1',
              [studentId]
            );
            if (activeRows.length > 0) {
              await db.query(
                'UPDATE internship_of_student SET company_id = ? WHERE student_internship_id = ?',
                [row.internship_company_id, activeRows[0].student_internship_id]
              );
            } else {
              await db.query(
                'INSERT INTO internship_of_student (student_id, company_id, student_internship_status) VALUES (?, ?, 1)',
                [studentId, row.internship_company_id]
              );
            }
          }
        }
      }

      if (row.role !== 'Student' && accountId) {
        const normalizedAdminEmail = String(row.email || '').trim();
        if (normalizedAdminEmail && !isValidEmail(normalizedAdminEmail)) {
          throw new Error(`Invalid admin email for account ${accountId}`);
        }

        const [adminExistsRows] = await db.query('SELECT admin_id FROM admin WHERE account_id = ? LIMIT 1', [accountId]);
        if (adminExistsRows.length > 0) {
          await db.query(
            'UPDATE admin SET admin_name = ?, email = ? WHERE account_id = ?',
            [row.username || null, normalizedAdminEmail || null, accountId]
          );
        } else {
          await db.query(
            'INSERT INTO admin (account_id, admin_name, email) VALUES (?, ?, ?)',
            [accountId, row.username || null, normalizedAdminEmail || null]
          );
        }

        if (normalizedAdminEmail) {
          existingAdminAccountByEmail.set(normalizedAdminEmail.toLowerCase(), accountId);
        }
      }

      return accountId;
    };

    for (const row of importedRows) {
      const accountId = await upsertAccount(row);
      if (accountId) {
        processedIdsByRole[row.role].add(accountId);
      }
    }

    // Keep import idempotent and safe: do not auto-delete accounts not present in the file.
    // Auto-deletion can break foreign keys (e.g., company -> admin) and is risky for partial imports.
    const deletedCount = 0;

    const uniqueAccountCount = processedIdsByRole.Admin.size + processedIdsByRole.Student.size;
    const processedRowCount = importedRows.length;
    const uniqueStudentCount = new Set(
      importedRows
        .filter((row) => row.role === 'Student' && Number(row.student_id) > 0)
        .map((row) => Number(row.student_id))
    ).size;
    const uniqueAdminCount = new Set(
      importedRows
        .filter((row) => row.role === 'Admin')
        .map((row) => Number(row.accountId || 0))
        .filter((id) => id > 0)
    ).size;

    const updatedCount = importedRows.some((row) => row.role === 'Student')
      ? (uniqueStudentCount || processedRowCount)
      : (uniqueAdminCount || processedRowCount);

    res.json({
      message: 'Users imported',
      updatedCount,
      processedRowCount,
      uniqueStudentCount,
      uniqueAdminCount,
      uniqueAccountCount,
      deletedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message || 'Database error' });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [studentRows] = await db.query("SELECT student_id FROM student WHERE account_id = ? LIMIT 1", [id]);
    let studentId = studentRows.length > 0 ? studentRows[0].student_id : null;

    if (!studentId) {
      const [studentByIdRows] = await db.query("SELECT student_id FROM student WHERE student_id = ? LIMIT 1", [id]);
      studentId = studentByIdRows.length > 0 ? studentByIdRows[0].student_id : null;
    }

    if (studentId) {
      await db.query("DELETE FROM quiz_result WHERE student_id = ?", [studentId]);
      await db.query("DELETE FROM career_fit_quiz WHERE student_id = ?", [studentId]);
      await db.query("DELETE FROM favorite WHERE student_id = ?", [studentId]);
      await db.query("DELETE FROM review WHERE student_id = ?", [studentId]);
      await db.query("DELETE FROM internship_of_student WHERE student_id = ?", [studentId]);
      await db.query("DELETE FROM student WHERE student_id = ?", [studentId]);
    }

    const [accountRows] = await db.query("SELECT account_id FROM account WHERE account_id = ? LIMIT 1", [id]);
    if (accountRows.length > 0) {
      await db.query("DELETE FROM account WHERE account_id = ?", [id]);
    }

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

    const normalizedCompanyName = normalizeCompanyName(company_name);

    if (!normalizedCompanyName) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อบริษัท' });
    }

    const normalizedCompanyEmail = String(company_email || '').trim();
    const normalizedCompanyPhone = normalizePhone(company_phone_num);

    const [duplicateCompanies] = await db.query(
      `SELECT company_id FROM company WHERE LOWER(TRIM(company_name)) = LOWER(TRIM(?)) LIMIT 1`,
      [normalizedCompanyName]
    );

    if (duplicateCompanies.length > 0) {
      return res.status(409).json({ message: 'ชื่อบริษัทนี้มีอยู่แล้วในระบบ' });
    }

    if (normalizedCompanyEmail && !isValidEmail(normalizedCompanyEmail)) {
      return res.status(400).json({ message: 'รูปแบบอีเมลบริษัทไม่ถูกต้อง' });
    }

    if (normalizedCompanyPhone && !isValidPhone(normalizedCompanyPhone)) {
      return res.status(400).json({ message: 'รูปแบบเบอร์โทรศัพท์บริษัทไม่ถูกต้อง' });
    }

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
        normalizedCompanyName,
        company_address || null, 
        company_type || null, 
        normalizedCompanyEmail || null, 
        normalizedCompanyPhone || null, 
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

    const normalizedCompanyName = normalizeCompanyName(company_name);

    if (!normalizedCompanyName) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อบริษัท' });
    }

    const normalizedCompanyEmail = String(company_email || '').trim();
    const normalizedCompanyPhone = normalizePhone(company_phone_num);

    const [duplicateCompanies] = await db.query(
      `SELECT company_id FROM company WHERE LOWER(TRIM(company_name)) = LOWER(TRIM(?)) AND company_id <> ? LIMIT 1`,
      [normalizedCompanyName, id]
    );

    if (duplicateCompanies.length > 0) {
      return res.status(409).json({ message: 'ชื่อบริษัทนี้มีอยู่แล้วในระบบ' });
    }

    if (normalizedCompanyEmail && !isValidEmail(normalizedCompanyEmail)) {
      return res.status(400).json({ message: 'รูปแบบอีเมลบริษัทไม่ถูกต้อง' });
    }

    if (normalizedCompanyPhone && !isValidPhone(normalizedCompanyPhone)) {
      return res.status(400).json({ message: 'รูปแบบเบอร์โทรศัพท์บริษัทไม่ถูกต้อง' });
    }

    await db.query(
      `UPDATE company SET 
        company_name = ?, company_address = ?, company_type = ?, 
        company_email = ?, company_phone_num = ?, company_link = ?, 
        company_description = ?, company_logo = ?, company_status = ? 
      WHERE company_id = ?`,
      [
        normalizedCompanyName, company_address, company_type, normalizedCompanyEmail || null,
        normalizedCompanyPhone || null, company_link, company_description,
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

app.post('/api/companies/import', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const rows = Array.isArray(req.body) ? req.body : [];
    if (rows.length === 0) {
      return res.status(400).json({ message: 'No valid rows to import' });
    }

    const parseNumber = (value, fallback = 0) => {
      if (typeof value === 'number') return value;
      if (value === undefined || value === null || value === '') return fallback;
      const parsed = parseInt(String(value).replace(/[^0-9-]/g, ''), 10);
      return Number.isNaN(parsed) ? fallback : parsed;
    };

    const parseStatus = (value) => {
      const normalized = String(value || '').trim().toLowerCase();
      if (normalized === '0' || normalized.includes('inactive') || normalized.includes('ปิด')) return 0;
      return 1;
    };

    const normalizeDate = (value) => {
      if (value === undefined || value === null || value === '') return null;

      if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null;
        return value.toISOString().slice(0, 10);
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        // Excel serial date (base 1899-12-30)
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const parsed = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed.toISOString().slice(0, 10);
      }

      const text = String(value).trim();
      if (!text) return null;

      const dmYMatch = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
      if (dmYMatch) {
        const day = Number(dmYMatch[1]);
        const month = Number(dmYMatch[2]);
        let year = Number(dmYMatch[3]);

        if (year > 2400) year -= 543; // Buddhist year to Gregorian year
        if (year < 100) year += 2000;

        const parsed = new Date(Date.UTC(year, month - 1, day));
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString().slice(0, 10);
        }
      }

      const parsed = new Date(text);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed.toISOString().slice(0, 10);
    };

    const normalizedRows = rows
      .map((row) => ({
        company_id: parseNumber(row.company_id || row['Company ID']),
        company_name: String(row.company_name || row['Company Name'] || '').trim(),
        company_address: String(row.company_address || row['Address'] || '').trim(),
        company_type: String(row.company_type || row['Type'] || '').trim(),
        company_email: String(row.company_email || row['Email'] || '').trim(),
        company_phone_num: String(row.company_phone_num || row['Phone'] || '').trim(),
        company_link: String(row.company_link || row['Link'] || '').trim(),
        company_description: String(row.company_description || row['Description'] || '').trim(),
        company_logo: String(row.company_logo || row['Logo URL'] || '').trim(),
        company_status: parseStatus(row.company_status ?? row['Status']),
        company_create_date: normalizeDate(row.company_create_date || row['Created Date']),
        admin_id: parseNumber(row.admin_id || row['Admin ID']),
        account_id: parseNumber(row.account_id || row['Account ID']),
      }))
      .filter((row) => row.company_name);

    const invalidRows = [];
    normalizedRows.forEach((row, index) => {
      if (row.company_email && !isValidEmail(row.company_email)) {
        invalidRows.push(`row ${index + 1}: Email ไม่ถูกต้อง (${row.company_email})`);
      }
      if (row.company_phone_num && !isValidPhone(row.company_phone_num)) {
        invalidRows.push(`row ${index + 1}: Phone ไม่ถูกต้อง (${row.company_phone_num})`);
      }
      row.company_phone_num = normalizePhone(row.company_phone_num);
    });

    if (invalidRows.length > 0) {
      return res.status(400).json({
        message: 'พบข้อมูลรูปแบบ Email/Phone ไม่ถูกต้องในไฟล์นำเข้า',
        details: invalidRows.slice(0, 20),
      });
    }

    if (normalizedRows.length === 0) {
      return res.status(400).json({ message: 'No valid rows to import' });
    }

    const rowMap = new Map();
    normalizedRows.forEach((row) => {
      const key = row.company_id > 0 ? `id:${row.company_id}` : `name:${row.company_name.toLowerCase()}`;
      rowMap.set(key, row);
    });
    const importedRows = Array.from(rowMap.values());

    await connection.beginTransaction();

    const [adminRows] = await connection.query('SELECT admin_id, account_id FROM admin');
    const adminByAccountId = new Map();
    adminRows.forEach((row) => {
      if (row.account_id) adminByAccountId.set(Number(row.account_id), row.admin_id);
    });
    const fallbackAdminId = adminRows.length > 0 ? adminRows[0].admin_id : null;

    if (!fallbackAdminId) {
      await connection.rollback();
      return res.status(400).json({ message: 'ไม่พบข้อมูลผู้ดูแลระบบสำหรับผูกกับบริษัท' });
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const row of importedRows) {
      let targetCompanyId = null;

      if (row.company_id > 0) {
        const [existingById] = await connection.query(
          'SELECT company_id FROM company WHERE company_id = ? LIMIT 1',
          [row.company_id]
        );
        if (existingById.length > 0) {
          targetCompanyId = existingById[0].company_id;
        }
      }

      if (!targetCompanyId) {
        const [existingByName] = await connection.query(
          'SELECT company_id FROM company WHERE LOWER(TRIM(company_name)) = LOWER(TRIM(?)) LIMIT 1',
          [row.company_name]
        );
        if (existingByName.length > 0) {
          targetCompanyId = existingByName[0].company_id;
        }
      }

      const resolvedAdminId = row.admin_id > 0
        ? row.admin_id
        : (row.account_id > 0 && adminByAccountId.has(row.account_id)
          ? adminByAccountId.get(row.account_id)
          : fallbackAdminId);

      if (targetCompanyId) {
        await connection.query(
          `UPDATE company SET
            company_name = ?, company_address = ?, company_type = ?, company_email = ?,
            company_phone_num = ?, company_link = ?, company_description = ?, company_logo = ?,
            company_status = ?, admin_id = ?,
            company_create_date = IFNULL(?, company_create_date)
          WHERE company_id = ?`,
          [
            row.company_name,
            row.company_address || null,
            row.company_type || null,
            row.company_email || null,
            row.company_phone_num || null,
            row.company_link || null,
            row.company_description || null,
            row.company_logo || null,
            row.company_status,
            resolvedAdminId,
            row.company_create_date,
            targetCompanyId,
          ]
        );
        updatedCount++;
        continue;
      }

      if (row.company_id > 0) {
        await connection.query(
          `INSERT INTO company (
            company_id, company_name, company_address, company_type, company_email,
            company_phone_num, company_link, company_description, company_logo,
            company_status, company_create_date, admin_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, IFNULL(?, NOW()), ?)`,
          [
            row.company_id,
            row.company_name,
            row.company_address || null,
            row.company_type || null,
            row.company_email || null,
            row.company_phone_num || null,
            row.company_link || null,
            row.company_description || null,
            row.company_logo || null,
            row.company_status,
            row.company_create_date,
            resolvedAdminId,
          ]
        );
      } else {
        await connection.query(
          `INSERT INTO company (
            company_name, company_address, company_type, company_email,
            company_phone_num, company_link, company_description, company_logo,
            company_status, company_create_date, admin_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, IFNULL(?, NOW()), ?)`,
          [
            row.company_name,
            row.company_address || null,
            row.company_type || null,
            row.company_email || null,
            row.company_phone_num || null,
            row.company_link || null,
            row.company_description || null,
            row.company_logo || null,
            row.company_status,
            row.company_create_date,
            resolvedAdminId,
          ]
        );
      }

      insertedCount++;
    }

    await connection.commit();
    res.json({
      message: 'Companies imported',
      insertedCount,
      updatedCount,
      totalCount: insertedCount + updatedCount,
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: err?.message || 'Database error' });
  } finally {
    connection.release();
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
    
    // 4. Total Interns (use the same source as User Management: student/account)
    //    This prevents mismatch where internship history rows outnumber actual users.
    let internsSql = `
      SELECT COUNT(DISTINCT s.student_id) as count
      FROM student s
    `;
    let internsParams = [];
    if (isFiltered) {
      internsSql = `
        SELECT COUNT(DISTINCT ios.student_id) as count
        FROM internship_of_student ios
      `;
      internsSql += buildPositionFilter('ios', 'student_internship_posts_name', internsParams);
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

app.post('/api/admin/positions/import', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const rows = Array.isArray(req.body) ? req.body : [];

    if (rows.length === 0) {
      return res.status(400).json({ message: 'No valid rows to import' });
    }

    const normalizeExcelKey = (key) =>
      String(key || '').trim().toLowerCase().replace(/[\W_]+/g, '');

    const parseNumber = (value, fallback = 0) => {
      if (typeof value === 'number') return value;
      if (value === undefined || value === null || value === '') return fallback;
      const parsed = parseInt(String(value).replace(/[^0-9-]/g, ''), 10);
      return Number.isNaN(parsed) ? fallback : parsed;
    };

    const normalizedRows = rows.map((row) => {
      const normalized = {};
      Object.entries(row || {}).forEach(([key, value]) => {
        normalized[normalizeExcelKey(key)] = value;
      });

      const getValue = (...keys) => {
        for (const key of keys) {
          const normalizedKey = normalizeExcelKey(key);
          if (normalized[normalizedKey] !== undefined && normalized[normalizedKey] !== null) {
            return normalized[normalizedKey];
          }
        }
        return '';
      };

      const questionList = Array.isArray(row?.questions)
        ? row.questions.map((question) => String(question || '').trim()).filter(Boolean)
        : [
            String(getValue('Question 1', 'question1', 'question_1') || '').trim(),
            String(getValue('Question 2', 'question2', 'question_2') || '').trim(),
            String(getValue('Question 3', 'question3', 'question_3') || '').trim(),
            String(getValue('Question 4', 'question4', 'question_4') || '').trim(),
            String(getValue('Question 5', 'question5', 'question_5') || '').trim(),
          ];

      return {
        position_id: parseNumber(getValue('Position ID', 'position_id', 'ID'), 0),
        position_name: String(getValue('Position Name', 'position_name', 'ชื่อตำแหน่ง') || '').trim(),
        position_description: String(getValue('Description', 'position_description', 'คำอธิบายตำแหน่งงาน') || '').trim(),
        position_skill: String(getValue('Skill Guide', 'position_skill', 'แนวทางการพัฒนาทักษะ') || '').trim(),
        questions: questionList.slice(0, 5),
      };
    });

    const rowMap = new Map();
    normalizedRows.forEach((row) => {
      if (!row.position_name) return;
      const key = row.position_id > 0
        ? `id:${row.position_id}`
        : `name:${row.position_name.toLowerCase()}`;
      rowMap.set(key, row);
    });

    const importedRows = Array.from(rowMap.values());
    if (importedRows.length === 0) {
      return res.status(400).json({ message: 'No valid rows to import' });
    }

    await connection.beginTransaction();

    let insertedCount = 0;
    let updatedCount = 0;

    for (const row of importedRows) {
      let targetPositionId = null;

      if (row.position_id > 0) {
        const [existingById] = await connection.query(
          'SELECT position_id FROM `position` WHERE position_id = ? LIMIT 1',
          [row.position_id]
        );
        if (existingById.length > 0) {
          targetPositionId = existingById[0].position_id;
        }
      }

      if (!targetPositionId) {
        const [existingByName] = await connection.query(
          'SELECT position_id FROM `position` WHERE LOWER(TRIM(position_name)) = LOWER(TRIM(?)) LIMIT 1',
          [row.position_name]
        );
        if (existingByName.length > 0) {
          targetPositionId = existingByName[0].position_id;
        }
      }

      if (targetPositionId) {
        await connection.query(
          'UPDATE `position` SET position_name = ?, position_description = ?, position_skill = ? WHERE position_id = ?',
          [row.position_name, row.position_description, row.position_skill, targetPositionId]
        );

        await connection.query('DELETE FROM quiz_question WHERE position_id = ?', [targetPositionId]);
        if (Array.isArray(row.questions) && row.questions.length > 0) {
          for (const question of row.questions.slice(0, 5)) {
            await connection.query(
              'INSERT INTO quiz_question (quiz_question, position_id) VALUES (?, ?)',
              [question, targetPositionId]
            );
          }
        }

        updatedCount++;
        continue;
      }

      if (row.position_id > 0) {
        const [insertResult] = await connection.query(
          'INSERT INTO `position` (position_id, position_name, position_description, position_skill) VALUES (?, ?, ?, ?)',
          [row.position_id, row.position_name, row.position_description, row.position_skill]
        );
        const newPositionId = insertResult.insertId || row.position_id;
        if (Array.isArray(row.questions) && row.questions.length > 0) {
          for (const question of row.questions.slice(0, 5)) {
            await connection.query(
              'INSERT INTO quiz_question (quiz_question, position_id) VALUES (?, ?)',
              [question, newPositionId]
            );
          }
        }
      } else {
        const [insertResult] = await connection.query(
          'INSERT INTO `position` (position_name, position_description, position_skill) VALUES (?, ?, ?)',
          [row.position_name, row.position_description, row.position_skill]
        );
        const newPositionId = insertResult.insertId;
        if (Array.isArray(row.questions) && row.questions.length > 0) {
          for (const question of row.questions.slice(0, 5)) {
            await connection.query(
              'INSERT INTO quiz_question (quiz_question, position_id) VALUES (?, ?)',
              [question, newPositionId]
            );
          }
        }
      }
      insertedCount++;
    }

    await connection.commit();
    res.json({
      message: 'Positions imported',
      insertedCount,
      updatedCount,
      totalCount: insertedCount + updatedCount,
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: err?.message || 'Database error' });
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
        DATE_FORMAT(i.internship_expired_date, '%Y-%m-%d') AS internship_expired_date,
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
        internship_create_date,
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
// GET ACTIVE POST TITLES BY COMPANY
// ==================================================
app.get("/api/posts/company/:id/titles", async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT DISTINCT
        internship_title
      FROM internship_posts
      WHERE company_id = ?
        AND internship_status = 1
        AND TRIM(COALESCE(internship_title, '')) <> ''
      ORDER BY internship_title ASC
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
        i.internship_create_date,
        i.internship_expired_date,
        i.internship_status,

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
        r.review_internship_position_title AS internship_position_title,
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
async function canStudentReviewCompany(studentId, companyId) {
  const [rows] = await db.query(
    `SELECT 1
     FROM internship_of_student
     WHERE student_id = ?
       AND company_id = ?
     LIMIT 1`,
    [studentId, companyId]
  );

  return rows.length > 0;
}

async function getLatestStudentInternshipPositionTitle(studentId, companyId) {
  const [rows] = await db.query(
    `SELECT student_internship_posts_name
     FROM internship_of_student
     WHERE student_id = ?
       AND company_id = ?
     ORDER BY student_internship_id DESC
     LIMIT 1`,
    [studentId, companyId]
  );

  return rows.length > 0 ? String(rows[0].student_internship_posts_name || '').trim() || null : null;
}

async function hasReviewedPosition(studentId, companyId, internshipPositionTitle) {
  if (!internshipPositionTitle) return false;

  const [rows] = await db.query(
    `SELECT 1
     FROM review
     WHERE student_id = ?
       AND company_id = ?
       AND review_internship_position_title = ?
     LIMIT 1`,
    [studentId, companyId, internshipPositionTitle]
  );

  return rows.length > 0;
}

async function getReviewEligibilityContext(studentId, companyId) {
  const internshipPositionTitle = await getLatestStudentInternshipPositionTitle(studentId, companyId);
  if (!internshipPositionTitle) {
    return {
      canReview: false,
      internship_position_title: null,
      reason: 'no internship position'
    };
  }

  const alreadyReviewed = await hasReviewedPosition(studentId, companyId, internshipPositionTitle);
  return {
    canReview: !alreadyReviewed,
    internship_position_title: internshipPositionTitle,
    reason: alreadyReviewed ? 'already reviewed this position' : 'eligible'
  };
}

app.get("/api/reviews/eligibility/:company_id", async (req, res) => {
  try {
    const companyId = Number(req.params.company_id);
    const studentId = Number(req.query.student_id);
    const userType = String(req.query.user_type || '').toLowerCase();

    if (!companyId || !studentId) {
      return res.status(400).json({ canReview: false, reason: 'missing data' });
    }

    if (userType !== 'student') {
      return res.json({ canReview: false, reason: 'only student can review' });
    }

    const context = await getReviewEligibilityContext(studentId, companyId);
    return res.json(context);
  } catch (err) {
    console.error('❌ REVIEW ELIGIBILITY ERROR:', err);
    res.status(500).json({ canReview: false, error: 'server error' });
  }
});

app.post("/api/reviews", async (req, res) => {
  try {
    let {
      company_id,
      student_id,
      user_type,
      review_sum_rating,
      review_work_rating,
      review_life_rating,
      review_commu_rating,
      review_comment
    } = req.body;

    company_id = Number(company_id);
    student_id = Number(student_id);

    if (user_type !== 'student') {
      return res.status(403).json({ message: 'เฉพาะนักศึกษาที่เคยฝึกงานกับบริษัทนี้เท่านั้นที่สามารถรีวิวได้' });
    }

    const context = await getReviewEligibilityContext(student_id, company_id);
    if (!context.canReview) {
      return res.status(403).json({ message: 'คุณยังไม่มีสิทธิ์รีวิวบริษัทนี้' });
    }

    const sql = `
      INSERT INTO review 
      (company_id, student_id, review_internship_position_title, review_sum_rating, review_work_rating, review_life_rating, review_commu_rating, review_comment, review_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await db.query(sql, [
      company_id,
      student_id,
      context.internship_position_title,
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
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'คุณได้รีวิวตำแหน่งนี้กับบริษัทนี้ไปแล้ว' });
    }
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
    const { user_type } = req.query; // 'student' or 'admin'
    
    // เอา ID ตามประเภท user - admin ใช้ negative ID
    const query_id = user_type === 'admin' ? -Math.abs(student_id) : student_id;

    const [rows] = await db.query(
      `SELECT internship_posts_id AS post_id
       FROM favorite
       WHERE student_id = ?`,
      [query_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.post("/api/favorites", async (req, res) => {
  try {
    const { student_id, post_id, user_type } = req.body;

    if (!student_id || !post_id) {
      return res.status(400).json({ error: "missing data" });
    }

    // เอา ID ตามประเภท user - admin ใช้ negative ID
    const insert_id = user_type === 'admin' ? -Math.abs(student_id) : student_id;

    await db.query(
      `INSERT IGNORE INTO favorite (student_id, internship_posts_id)
       VALUES (?, ?)`,
      [insert_id, post_id]
    );

    res.json({ message: "added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.delete("/api/favorites", async (req, res) => {
  try {
    const { student_id, post_id, user_type } = req.body;

    // เอา ID ตามประเภท user - admin ใช้ negative ID
    const delete_id = user_type === 'admin' ? -Math.abs(student_id) : student_id;

    await db.query(
      `DELETE FROM favorite
       WHERE student_id = ? AND internship_posts_id = ?`,
      [delete_id, post_id]
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

    const normalizeMou = (value) => {
      if (typeof value === 'boolean') return value ? 1 : 0;
      if (typeof value === 'number') return value > 0 ? 1 : 0;
      const normalized = String(value || '').trim().toLowerCase();
      return ['1', 'true', 'yes', 'y', 'on', 'checked', 'ใช่'].includes(normalized) ? 1 : 0;
    };

    const normalizedApplyType = internship_apply_type || 'link';
    const normalizedInternshipLink = String(internship_link || '').trim();

    if (normalizedInternshipLink) {
      if (normalizedApplyType === 'email' && !isValidEmail(normalizedInternshipLink)) {
        return res.status(400).json({ message: 'รูปแบบอีเมลสำหรับสมัครงานไม่ถูกต้อง' });
      }
      if (normalizedApplyType !== 'email' && !isValidHttpUrl(normalizedInternshipLink)) {
        return res.status(400).json({ message: 'รูปแบบลิงก์สมัครงานไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)' });
      }
    }

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
        normalizedInternshipLink || null, normalizedApplyType, internship_poster || null, internship_status ?? 1, normalizeMou(mou), finalAdminId
      ]
    );

    if (internship_expired_date) {
      await updateExpiredPosts();
    }

    res.json({ message: "Post created", post_id: result.insertId });
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

    const normalizeMou = (value) => {
      if (typeof value === 'boolean') return value ? 1 : 0;
      if (typeof value === 'number') return value > 0 ? 1 : 0;
      const normalized = String(value || '').trim().toLowerCase();
      return ['1', 'true', 'yes', 'y', 'on', 'checked', 'ใช่'].includes(normalized) ? 1 : 0;
    };

    const normalizedApplyType = internship_apply_type || 'link';
    const normalizedInternshipLink = String(internship_link || '').trim();

    if (normalizedInternshipLink) {
      if (normalizedApplyType === 'email' && !isValidEmail(normalizedInternshipLink)) {
        return res.status(400).json({ message: 'รูปแบบอีเมลสำหรับสมัครงานไม่ถูกต้อง' });
      }
      if (normalizedApplyType !== 'email' && !isValidHttpUrl(normalizedInternshipLink)) {
        return res.status(400).json({ message: 'รูปแบบลิงก์สมัครงานไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)' });
      }
    }

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
        normalizedInternshipLink || null, normalizedApplyType, internship_poster || null, internship_status, normalizeMou(mou), id
      ]
    );

    if (internship_expired_date) {
      await updateExpiredPosts();
    }

    res.json({ message: "Post updated" });
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

app.post('/api/posts/import', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const rows = Array.isArray(req.body) ? req.body : [];
    if (rows.length === 0) {
      return res.status(400).json({ message: 'No valid rows to import' });
    }

    const parseNumber = (value, fallback = 0) => {
      if (typeof value === 'number') return value;
      if (value === undefined || value === null || value === '') return fallback;
      const parsed = parseInt(String(value).replace(/[^0-9-]/g, ''), 10);
      return Number.isNaN(parsed) ? fallback : parsed;
    };

    const parseStatus = (value) => {
      const normalized = String(value || '').trim().toLowerCase();
      if (normalized === '0' || normalized.includes('inactive') || normalized.includes('ปิด')) return 0;
      return 1;
    };

    const parseYesNo = (value) => {
      if (typeof value === 'boolean') return value ? 1 : 0;
      if (typeof value === 'number') return value > 0 ? 1 : 0;
      const normalized = String(value || '').trim().toLowerCase();
      return ['1', 'true', 'yes', 'y', 'on', 'checked', 'ใช่'].includes(normalized) ? 1 : 0;
    };

    const normalizeDate = (value) => {
      if (!value) return null;

      if (typeof value === 'string') {
        const raw = value.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;

      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const normalizedRows = rows
      .map((row) => ({
        post_id: parseNumber(row.post_id || row['Post ID']),
        company_id: parseNumber(row.company_id || row['Company ID']),
        company_name: String(row.company_name || row['Company Name'] || '').trim(),
        internship_title: String(row.internship_title || row['Title'] || row['Internship Title'] || '').trim(),
        internship_location: String(row.internship_location || row['Location'] || '').trim(),
        internship_duration: String(row.internship_duration || row['Duration'] || '').trim(),
        internship_description: String(row.internship_description || row['Description'] || '').trim(),
        internship_responsibilities: String(row.internship_responsibilities || row['Responsibilities'] || '').trim(),
        internship_requirements: String(row.internship_requirements || row['Requirements'] || '').trim(),
        internship_compensation: String(row.internship_compensation || row['Compensation'] || '').trim(),
        internship_working_method: String(row.internship_working_method || row['Working Method'] || '').trim(),
        internship_link: String(row.internship_link || row['Link'] || '').trim(),
        internship_apply_type: String(row.internship_apply_type || row['Apply Type'] || '').trim().toLowerCase(),
        internship_create_date: normalizeDate(row.internship_create_date || row['Created Date']),
        internship_expired_date: normalizeDate(row.internship_expired_date || row['Expired Date']),
        internship_status: parseStatus(row.internship_status ?? row['Status']),
        mou: parseYesNo(row.mou ?? row['MOU']),
      }))
      .filter((row) => row.internship_title);

    const invalidPostRows = [];
    normalizedRows.forEach((row, index) => {
      const normalizedApplyType = String(row.internship_apply_type || '').trim().toLowerCase();
      let applyType = normalizedApplyType;

      if (applyType !== 'email' && applyType !== 'link') {
        applyType = row.internship_link && isValidEmail(row.internship_link) ? 'email' : 'link';
      }

      row.internship_apply_type = applyType;

      if (row.internship_link) {
        if (applyType === 'email' && !isValidEmail(row.internship_link)) {
          invalidPostRows.push(`row ${index + 1}: Apply email ไม่ถูกต้อง (${row.internship_link})`);
        }
        if (applyType !== 'email' && !isValidHttpUrl(row.internship_link)) {
          invalidPostRows.push(`row ${index + 1}: Apply link ไม่ถูกต้อง (${row.internship_link})`);
        }
      }
    });

    if (invalidPostRows.length > 0) {
      return res.status(400).json({
        message: 'พบข้อมูลรูปแบบช่องทางสมัครไม่ถูกต้องในไฟล์นำเข้าโพสต์',
        details: invalidPostRows.slice(0, 20),
      });
    }

    if (normalizedRows.length === 0) {
      return res.status(400).json({ message: 'No valid rows to import' });
    }

    const rowMap = new Map();
    normalizedRows.forEach((row) => {
      const key = row.post_id > 0
        ? `id:${row.post_id}`
        : `title:${row.internship_title.toLowerCase()}|company:${row.company_id}`;
      rowMap.set(key, row);
    });
    const importedRows = Array.from(rowMap.values());

    await connection.beginTransaction();

    const [adminRows] = await connection.query('SELECT admin_id FROM admin LIMIT 1');
    const fallbackAdminId = adminRows.length > 0 ? adminRows[0].admin_id : null;
    if (!fallbackAdminId) {
      await connection.rollback();
      return res.status(400).json({ message: 'ไม่พบข้อมูลผู้ดูแลระบบสำหรับผูกกับโพสต์' });
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const row of importedRows) {
      let resolvedCompanyId = row.company_id;

      if (!(resolvedCompanyId > 0) && row.company_name) {
        const [companyRows] = await connection.query(
          'SELECT company_id FROM company WHERE LOWER(TRIM(company_name)) = LOWER(TRIM(?)) LIMIT 1',
          [row.company_name]
        );
        if (companyRows.length > 0) {
          resolvedCompanyId = companyRows[0].company_id;
        }
      }

      if (!(resolvedCompanyId > 0)) {
        continue;
      }

      let targetPostId = null;
      if (row.post_id > 0) {
        const [existingById] = await connection.query(
          'SELECT internship_posts_id FROM internship_posts WHERE internship_posts_id = ? LIMIT 1',
          [row.post_id]
        );
        if (existingById.length > 0) {
          targetPostId = existingById[0].internship_posts_id;
        }
      }

      if (!targetPostId) {
        const [existingByTitle] = await connection.query(
          'SELECT internship_posts_id FROM internship_posts WHERE company_id = ? AND LOWER(TRIM(internship_title)) = LOWER(TRIM(?)) LIMIT 1',
          [resolvedCompanyId, row.internship_title]
        );
        if (existingByTitle.length > 0) {
          targetPostId = existingByTitle[0].internship_posts_id;
        }
      }

      if (targetPostId) {
        await connection.query(
          `UPDATE internship_posts SET
            internship_title = ?, company_id = ?, internship_working_method = ?, internship_duration = ?,
            internship_location = ?, internship_compensation = ?, internship_description = ?,
            internship_responsibilities = ?, internship_requirements = ?, internship_expired_date = ?,
            internship_link = ?, internship_apply_type = ?, internship_status = ?, mou = ?,
            internship_create_date = IFNULL(?, internship_create_date)
          WHERE internship_posts_id = ?`,
          [
            row.internship_title,
            resolvedCompanyId,
            row.internship_working_method || null,
            row.internship_duration || null,
            row.internship_location || null,
            row.internship_compensation || null,
            row.internship_description || null,
            row.internship_responsibilities || null,
            row.internship_requirements || null,
            row.internship_expired_date,
            row.internship_link || null,
            row.internship_apply_type || 'link',
            row.internship_status,
            row.mou,
            row.internship_create_date,
            targetPostId,
          ]
        );
        updatedCount++;
        continue;
      }

      if (row.post_id > 0) {
        await connection.query(
          `INSERT INTO internship_posts (
            internship_posts_id, internship_title, company_id, internship_working_method,
            internship_duration, internship_location, internship_compensation, internship_description,
            internship_responsibilities, internship_requirements, internship_expired_date, internship_link,
            internship_apply_type, internship_poster, internship_status, mou, admin_id, internship_create_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, IFNULL(?, NOW()))`,
          [
            row.post_id,
            row.internship_title,
            resolvedCompanyId,
            row.internship_working_method || null,
            row.internship_duration || null,
            row.internship_location || null,
            row.internship_compensation || null,
            row.internship_description || null,
            row.internship_responsibilities || null,
            row.internship_requirements || null,
            row.internship_expired_date,
            row.internship_link || null,
            row.internship_apply_type || 'link',
            null,
            row.internship_status,
            row.mou,
            fallbackAdminId,
            row.internship_create_date,
          ]
        );
      } else {
        await connection.query(
          `INSERT INTO internship_posts (
            internship_title, company_id, internship_working_method,
            internship_duration, internship_location, internship_compensation, internship_description,
            internship_responsibilities, internship_requirements, internship_expired_date, internship_link,
            internship_apply_type, internship_poster, internship_status, mou, admin_id, internship_create_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, IFNULL(?, NOW()))`,
          [
            row.internship_title,
            resolvedCompanyId,
            row.internship_working_method || null,
            row.internship_duration || null,
            row.internship_location || null,
            row.internship_compensation || null,
            row.internship_description || null,
            row.internship_responsibilities || null,
            row.internship_requirements || null,
            row.internship_expired_date,
            row.internship_link || null,
            row.internship_apply_type || 'link',
            null,
            row.internship_status,
            row.mou,
            fallbackAdminId,
            row.internship_create_date,
          ]
        );
      }
      insertedCount++;
    }

    await connection.commit();

    await updateExpiredPosts();

    res.json({
      message: 'Posts imported',
      insertedCount,
      updatedCount,
      totalCount: insertedCount + updatedCount,
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: err?.message || 'Database error' });
  } finally {
    connection.release();
  }
});

const updateExpiredPosts = require('./updateExpiredPosts');

const THAILAND_OFFSET_MS = 7 * 60 * 60 * 1000;
const HOUR_IN_MS = 60 * 60 * 1000;

function scheduleExpiredPostUpdates() {
  const now = Date.now();
  const thailandNow = now + THAILAND_OFFSET_MS;
  const nextHourThailand = Math.ceil(thailandNow / HOUR_IN_MS) * HOUR_IN_MS;
  const delay = nextHourThailand - thailandNow || HOUR_IN_MS;

  const runAndReschedule = async () => {
    await updateExpiredPosts();
    setInterval(updateExpiredPosts, HOUR_IN_MS);
  };

  setTimeout(runAndReschedule, delay);
}

// Run the update function once on startup, then align future runs to every hour in Thailand time.
updateExpiredPosts();
scheduleExpiredPostUpdates();

///////NOTI///////////
app.get("/api/notifications/:student_id", async (req, res) => {
  try {
    const { student_id } = req.params;
    const { user_type } = req.query;
    const notificationsEnabled = req.query.enabled === 'true';
    const queryId = user_type === 'admin' ? -Math.abs(Number(student_id)) : Number(student_id);

    // ❌ ถ้าปิดการแจ้งเตือน ให้ return array ว่าง
    if (!notificationsEnabled) {
      return res.json([]);
    }

    const [rows] = await db.query(`
      SELECT 
        i.internship_posts_id AS post_id,
        i.internship_title,
        i.internship_expired_date
      FROM favorite f
      JOIN internship_posts i 
        ON f.internship_posts_id = i.internship_posts_id
      WHERE f.student_id = ?
        AND i.internship_status = 1
        AND DATE(i.internship_expired_date) > CURDATE()
    `, [queryId]);

    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const notifications = rows
      .map(post => {
        const expired = new Date(post.internship_expired_date);
        const expiredOnly = new Date(expired.getFullYear(), expired.getMonth(), expired.getDate());
        const diffTime = expiredOnly.getTime() - todayOnly.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 3 && diffDays >= 1) {
          return {
            ...post,
            daysLeft: diffDays
          };
        }
        return null;
      })
      .filter(Boolean);

    res.json(notifications);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// ==================================================
// GET ADMIN NOTIFICATIONS (ใกล้หมดอายุ)
// ==================================================
app.get("/api/admin/notifications", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        internship_posts_id AS post_id,
        internship_title,
        internship_expired_date
      FROM internship_posts
      WHERE internship_status = 1
        AND DATE(internship_expired_date) > CURDATE()
    `);

    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const notifications = rows
      .map(post => {
        const expired = new Date(post.internship_expired_date);
        const expiredOnly = new Date(expired.getFullYear(), expired.getMonth(), expired.getDate());
        const diffTime = expiredOnly.getTime() - todayOnly.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7 && diffDays >= 1) {  // แสดงถ้าเหลือ 7 ถึง 1 วัน
          return {
            ...post,
            daysLeft: diffDays
          };
        }
        return null;
      })
      .filter(Boolean);

    res.json(notifications);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
