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
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});