require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
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

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL");
    connection.release();
  }
});

// ==================================================
// LOGIN
// ==================================================
app.post("/api/login", (req, res) => {

  const { email, password } = req.body;

  const sql = "SELECT * FROM account WHERE username = ?";

  db.query(sql, [email], (err, results) => {

    if (err) {
      return res.status(500).json(err);
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Username หรือ Password ไม่ถูกต้อง" });
    }

    const user = results[0];

    if (password !== user.password) {
      return res.status(401).json({ message: "Username หรือ Password ไม่ถูกต้อง" });
    }

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
      i.internship_expired_date,
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
      internship_expired_date
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

app.post("/api/reviews", (req, res) => {
  let {
    company_id,
    student_id,
    review_sum_rating,
    review_work_rating,
    review_life_rating,
    review_commu_rating,
    review_comment
  } = req.body;

  console.log("BODY:", req.body);

  // ======================
  // ✅ convert type
  // ======================
  company_id = Number(company_id);
  student_id = Number(student_id);

  review_sum_rating = Number(review_sum_rating) || 0;
  review_work_rating = Number(review_work_rating) || 0;
  review_life_rating = Number(review_life_rating) || 0;
  review_commu_rating = Number(review_commu_rating) || 0;

  // ======================
  // ✅ validation
  // ======================
  if (!company_id || !student_id) {
    return res.status(400).json({
      message: "company_id และ student_id จำเป็นต้องมี"
    });
  }

  // ⭐ clamp rating 0-5
  const clamp = (val) => Math.max(0, Math.min(5, val));

  review_sum_rating = clamp(review_sum_rating);
  review_work_rating = clamp(review_work_rating);
  review_life_rating = clamp(review_life_rating);
  review_commu_rating = clamp(review_commu_rating);

  // ======================
  // ✅ SQL
  // ======================
  const sql = `
    INSERT INTO review 
    (company_id, student_id, review_sum_rating, review_work_rating, review_life_rating, review_commu_rating, review_comment, review_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  db.query(
    sql,
    [
      company_id,
      student_id,
      review_sum_rating,
      review_work_rating,
      review_life_rating,
      review_commu_rating,
      review_comment || ""
    ],
    (err, result) => {
      if (err) {
        console.error("❌ Insert review error:", err);
        return res.status(500).json({
          error: err.message
        });
      }

      res.json({
        message: "✅ Review created",
        review_id: result.insertId
      });
    }
  );
});
// ==================================================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});