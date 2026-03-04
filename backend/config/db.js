const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "yourpassword",
  database: "ictern"
});

db.connect((err) => {
  if (err) {
    console.error("DB connection error:", err);
  } else {
    console.log("MySQL Connected");
  }
});

module.exports = db;