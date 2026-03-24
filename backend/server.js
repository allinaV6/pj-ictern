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
// GET REVIEWS
// ==================================================
app.get("/api/reviews/company/:id", async (req, res) => {
  try {
    const companyId = req.params.id;

    const sql = `
      SELECT 
        review_id AS id,
        review_sum_rating,
        review_work_rating,
        review_life_rating,
        review_commu_rating,
        review_comment,
        review_date AS created_at
      FROM review
      WHERE company_id = ?
      ORDER BY review_date DESC
    `;

    const [rows] = await db.query(sql, [companyId]);
    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "fetch reviews error" });
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

// ==================================================
// GET QUIZ QUESTIONS
// ==================================================
app.get('/api/questions', async (req, res) => {
  try {
    const { positions } = req.query;

    const positionIds = positions.split(',').map(Number);
    const results = [];

    for (const pos of positionIds) {
      const [rows] = await db.query(
        `SELECT 
          question_id AS id,
          quiz_question as question_text,
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
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================================================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});