const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await pool.query("ALTER TABLE products ADD COLUMN sub_category VARCHAR(255) DEFAULT 'All'");
    console.log('Successfully added sub_category column!');
    process.exit(0);
  } catch(err) {
    if (err.code === '42701') {
      console.log('Column already exists.');
      process.exit(0);
    }
    console.error(err);
    process.exit(1);
  }
})();
