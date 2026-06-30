const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Always use SSL for remote databases like Supabase/Neon
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function initDB() {
  const client = await pool.connect();
  try {
    console.log('Connected to the PostgreSQL database.');
    
    // Create Products Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        original_price INTEGER,
        discount_price INTEGER,
        rating REAL,
        image_url TEXT
      )
    `);

    // Create Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Create Gallery Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gallery_images (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        image_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user'
      )
    `);

    // Create Wishlists Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(user_id, product_id)
      )
    `);

    // Create Orders Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        design_type TEXT,
        quantity INTEGER DEFAULT 1,
        size TEXT,
        requirements TEXT,
        reference_image_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed database if empty
    const res = await client.query('SELECT count(*) as count FROM products');
    if (parseInt(res.rows[0].count) === 0) {
      const seedProducts = [
        { title: 'Custom Photo Mug', category: 'gifts', original_price: 499, discount_price: 249, rating: 4.8, image_url: 'assets/AK_Products/ak_product_2.jpeg' },
        { title: 'Custom Printed T-Shirt', category: 'apparel', original_price: 599, discount_price: 349, rating: 5.0, image_url: 'assets/images/gallery-tshirt.png' },
        { title: 'Personalized Cushion', category: 'gifts', original_price: 699, discount_price: 399, rating: 4.5, image_url: 'assets/AK_Products/ak_product_3.jpeg' },
        { title: 'Custom Photo Frame', category: 'gifts', original_price: 599, discount_price: 299, rating: 4.8, image_url: 'assets/AK_Products/ak_product_4.jpeg' },
        { title: 'Custom Water Bottle', category: 'gifts', original_price: 399, discount_price: 199, rating: 4.9, image_url: 'assets/AK_Products/ak_product_5.jpeg' },
        { title: 'Premium Visiting Cards', category: 'marketing', original_price: 499, discount_price: 299, rating: 4.7, image_url: 'assets/images/gallery-flex-banner.png' }
      ];

      for (const p of seedProducts) {
        await client.query(
          'INSERT INTO products (title, category, original_price, discount_price, rating, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
          [p.title, p.category, p.original_price, p.discount_price, p.rating, p.image_url]
        );
      }
      console.log('Database seeded with initial products.');
    }

    // Seed gallery if empty
    const galRes = await client.query('SELECT count(*) as count FROM gallery_images');
    if (parseInt(galRes.rows[0].count) === 0) {
      const seedGallery = [
        { title: 'Flex Banner', image_url: 'assets/images/gallery-flex-banner.png' },
        { title: 'Custom Mug', image_url: 'assets/images/gallery-custom-mug.png' },
        { title: 'T-Shirt Print', image_url: 'assets/images/gallery-tshirt.png' },
        { title: 'Gift Items', image_url: 'assets/images/hero-products.png' },
        { title: 'Our Studio', image_url: 'assets/images/about-shop.png' },
        { title: 'Sample Products', image_url: 'assets/images/gallery-samples.png' }
      ];

      for (const g of seedGallery) {
        await client.query(
          'INSERT INTO gallery_images (title, image_url) VALUES ($1, $2)',
          [g.title, g.image_url]
        );
      }
      console.log('Database seeded with initial gallery images.');
    }
  } catch (err) {
    console.error('Error initializing database', err);
  } finally {
    client.release();
  }
}

// Initialize tables on startup
initDB();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
