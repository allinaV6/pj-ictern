require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

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
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    console.log('✅ Connected to database for expired posts update.');

    const thailandDate = getThailandDate();

    const [closeResult] = await conn.query(
      `UPDATE internship_posts
       SET internship_status = 0
       WHERE internship_expired_date IS NOT NULL
         AND DATE(internship_expired_date) <= ?
         AND internship_status <> 0`,
      [thailandDate]
    );

    const [openResult] = await conn.query(
      `UPDATE internship_posts
       SET internship_status = 1
       WHERE internship_expired_date IS NOT NULL
         AND DATE(internship_expired_date) > ?
         AND internship_status <> 1`,
      [thailandDate]
    );

    const closedCount = closeResult.affectedRows || 0;
    const openedCount = openResult.affectedRows || 0;

    if (closedCount > 0 || openedCount > 0) {
      console.log(`✅ Synced internship status by expired date (closed: ${closedCount}, opened: ${openedCount}).`);
    } else {
      console.log('ℹ️ No internship posts needed status sync.');
    }

    await conn.end();
  } catch (err) {
    console.error('❌ Error updating expired posts:', err);
  }
}

module.exports = updateExpiredPosts;
