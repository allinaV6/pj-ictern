require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = 5000;

// =====================
// Middleware
// =====================
app.use(cors());
app.use(express.json());

// =====================
// MySQL Connection (ใช้ connection pool เสถียรกว่า)
// =====================
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ICTern",
  port: process.env.DB_PORT || 3306,
});

// ทดสอบ connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL");
    connection.release();
  }
});


// ==================================================
// ✅ LOGIN API
// ==================================================
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM account WHERE username = ?";

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ message: "Database error" });
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
// ✅ GET ALL INTERNSHIP POSTS
// ==================================================
app.get("/api/posts", (req, res) => {
  const sql = `
    SELECT 
      internship_posts_id AS id,
      internship_title AS title,
      internship_location AS location,
      internship_duration AS duration,
      internship_compensation AS allowance,
      internship_working_method AS type,
      internship_create_date AS posted,
      internship_posts_stat AS status
    FROM internship_posts
    ORDER BY internship_posts_id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL ERROR:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    res.json(results);
  });
});


// ==================================================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});