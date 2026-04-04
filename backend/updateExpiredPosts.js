const mysql = require('mysql2/promise');

const THAILAND_OFFSET_MS = 7 * 60 * 60 * 1000;

function getThailandDate() {
  return new Date(Date.now() + THAILAND_OFFSET_MS).toISOString().slice(0, 10);
}

async function updateExpiredPosts() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    console.log('✅ Connected to database for expired posts update.');

    const thailandDate = getThailandDate();

    const [result] = await conn.query(
      `UPDATE internship_posts
       SET internship_status = 0
       WHERE internship_expired_date < ? AND internship_status = 1`,
      [thailandDate]
    );

    const affectedRows = result.affectedRows;
    if (affectedRows > 0) {
      console.log(`✅ Updated ${affectedRows} expired internship posts to status 0 (closed).`);
    } else {
      console.log('ℹ️ No internship posts found to update.');
    }

    await conn.end();
  } catch (err) {
    console.error('❌ Error updating expired posts:', err);
  }
}

module.exports = updateExpiredPosts;
