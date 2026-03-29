import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

console.log('🔥 test-db.js is running');

async function testDB() {
  console.log('➡️ entering testDB()');

  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    console.log('✅ connection created');

    const [rows] = await conn.query('SHOW COLUMNS FROM internship_posts');
    console.log('✅ internship_posts columns:', rows);

    await conn.end();
    console.log('🔚 connection closed');
  } catch (err) {
    console.error('❌ DB Error');
    console.error(err);
  }
}

testDB();
