import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function updateDB() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    console.log('✅ Connection created');

    const [columns] = await conn.query('SHOW COLUMNS FROM internship_posts LIKE "internship_apply_type"');
    if (columns.length === 0) {
      // Add column with default value 'link'
      await conn.query("ALTER TABLE internship_posts ADD COLUMN internship_apply_type VARCHAR(20) DEFAULT 'link' AFTER internship_link");
      console.log('✅ Added column internship_apply_type to internship_posts');
    } else {
      console.log('ℹ️ Column internship_apply_type already exists');
    }

    await conn.end();
  } catch (err) {
    console.error('❌ Error updating DB:', err);
  }
}

updateDB();
