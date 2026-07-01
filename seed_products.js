const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const dummyProducts = [
  { title: 'Premium Star Flex Banner', category: 'flex', sub_category: 'Star Flex', original_price: 1500, discount_price: 1200, rating: 4.8, image: 'assets/images/gallery-flex-banner.png' },
  { title: 'Standard Frontlit Flex', category: 'flex', sub_category: 'Frontlit Flex', original_price: 800, discount_price: 650, rating: 4.5, image: 'assets/images/gallery-flex-banner.png' },
  { title: 'Executive Business Cards', category: 'paper', sub_category: 'Business Cards', original_price: 500, discount_price: 399, rating: 4.9, image: 'assets/images/business_cards.png' },
  { title: 'A4 Letterhead Bundle', category: 'paper', sub_category: 'Letterheads', original_price: 1200, discount_price: 999, rating: 4.7, image: 'assets/images/letterhead.png' },
  { title: 'Glossy Vinyl Sticker Set', category: 'vinyl', sub_category: 'Glossy Vinyl', original_price: 450, discount_price: 350, rating: 4.6, image: 'assets/images/vinyl_stickers.png' },
  { title: 'Personalized Photo Mug', category: 'sublimation', sub_category: 'Mugs', original_price: 399, discount_price: 299, rating: 5.0, image: 'assets/images/gallery-custom-mug.png' },
  { title: 'Custom Sublimation Cushion', category: 'sublimation', sub_category: 'Cushions', original_price: 699, discount_price: 549, rating: 4.8, image: 'assets/AK_Products/ak_product_3.jpeg' },
  { title: 'DTF Cotton T-Shirt', category: 'dtf', sub_category: 'Cotton T-Shirts', original_price: 899, discount_price: 699, rating: 4.9, image: 'assets/images/gallery-tshirt.png' },
  { title: 'Custom Print Tote Bag', category: 'dtf', sub_category: 'Tote Bags', original_price: 499, discount_price: 399, rating: 4.4, image: 'assets/images/tote_bag.png' }
];

(async () => {
  try {
    console.log('Deleting existing products...');
    await pool.query("DELETE FROM products");
    
    console.log('Inserting new dummy products...');
    for (const p of dummyProducts) {
      await pool.query(
        "INSERT INTO products (title, category, sub_category, original_price, discount_price, rating, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [p.title, p.category, p.sub_category, p.original_price, p.discount_price, p.rating, p.image]
      );
    }
    
    console.log('Successfully seeded database with new products!');
    process.exit(0);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
})();
