require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

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

    const [rows] = await db.query(
      "SELECT * FROM student WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      user: rows[0]
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ error: "server error" });
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
        i.internship_expired_date,
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
        i.internship_title,
        i.internship_location,
        i.internship_duration,
        i.internship_description,
        i.internship_responsibilities,
        i.internship_requirements,
        i.internship_compensation,
        i.internship_working_method,
        i.internship_link,
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
        internship_expired_date
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
// GET REVIEWS (TOP PAGES)
// ==================================================
app.get('/api/reviews/company/:id', async (req, res) => {
  const { id } = req.params;

  const [rows] = await db.query(
    'SELECT * FROM reviews WHERE company_id = ?',
    [id]
  );

  res.json(rows);
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

    if (!ids) {
      return res.status(400).json({ message: "ids required" });
    }

    const idArray = ids.split(',').map(Number);

    const [rows] = await db.query(
      `SELECT position_id, position_name, position_skill
       FROM position
       WHERE position_id IN (?)`,
      [idArray]
    );

    res.json(rows);

  } catch (err) {
    console.error("❌ POSITION ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
});
// ==================================================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});