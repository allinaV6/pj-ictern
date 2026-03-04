require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// ================= DATABASE =================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.log("DB Error:", err);
  } else {
    console.log("MySQL Connected");
  }
});

// ================= LOGIN =================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing username or password" });
  }

  db.query(
    "SELECT * FROM accounts WHERE username = ?",
    [username],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }

      if (result.length === 0) {
        return res.status(401).json({ message: "User not found" });
      }

      const user = result[0];

      // ตรวจสอบ account_status
      if (user.account_status !== 1) {
        return res.status(403).json({ message: "Account is disabled" });
      }

      // ตอนนี้ password เป็น plain text
      if (password !== user.password) {
        return res.status(401).json({ message: "Wrong password" });
      }

      const token = jwt.sign(
        {
          id: user.account_id,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        message: "Login successful",
        token,
        role: user.role,
        username: user.username
      });
    }
  );
});

// ================= PROTECTED TEST =================
app.get("/api/profile", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    res.json({ user });
  });
});

// ================= START SERVER =================
app.listen(5000, () => {
  console.log("Server running on port 5000");
});