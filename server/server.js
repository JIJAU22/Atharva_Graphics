// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const bcrypt = require('bcrypt');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('./db');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Custom requireAuth middleware using JWT
const requireAuth = () => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.auth = decoded; // Contains id, email, role
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Middleware for Admin only routes
const requireAdmin = () => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
      req.auth = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};

// ==================== AUTHENTICATION API ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim()) : [];
  const role = adminEmails.includes(email) ? 'admin' : 'user';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, email, hashedPassword, role]
    );
    const newUserId = result.rows[0].id;
    const token = jwt.sign({ id: newUserId, email, role, name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: newUserId, name, email, role } });
  } catch (err) {
    if (err.code === '23505') { // PostgreSQL unique constraint violation code
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];
    
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    // Recheck admin role based on .env
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim()) : [];
    let role = user.role;
    
    if (adminEmails.includes(email) && role !== 'admin') {
      role = 'admin';
      await db.query("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
    } else if (!adminEmails.includes(email) && role === 'admin') {
      role = 'user';
      await db.query("UPDATE users SET role = 'user' WHERE id = $1", [user.id]);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile
app.get('/api/auth/me', requireAuth(), async (req, res) => {
  try {
    const { rows } = await db.query("SELECT id, name, email, role FROM users WHERE id = $1", [req.auth.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ isAdmin: user.role === 'admin', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all products (public)
let productsCache = null;

app.get('/api/products', async (req, res) => {
  try {
    if (productsCache) {
      return res.json({ products: productsCache });
    }
    const { rows } = await db.query('SELECT * FROM products ORDER BY id DESC');
    productsCache = rows;
    res.json({ products: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new product (admin only)
app.post('/api/admin/products', requireAdmin(), upload.single('image'), async (req, res) => {
  const { title, category, sub_category, original_price, discount_price, rating } = req.body;
  
  try {
    let image_url = 'assets/AK_Products/ak_product_2.jpeg';
    
    if (req.file) {
      const fileName = `prod-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
      const { error } = await supabase.storage.from('products').upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
      image_url = publicUrlData.publicUrl;
    }

    const result = await db.query(
      'INSERT INTO products (title, category, sub_category, original_price, discount_price, rating, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, category, sub_category || 'All', original_price, discount_price, rating || 5.0, image_url]
    );
    productsCache = null; // Invalidate cache
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update product (admin only)
app.put('/api/admin/products/:id', requireAdmin(), upload.single('image'), async (req, res) => {
  const id = req.params.id;
  const { title, category, sub_category, original_price, discount_price, rating } = req.body;
  
  try {
    const { rows } = await db.query('SELECT image_url FROM products WHERE id = $1', [id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'Product not found' });

    let image_url = row.image_url;
    if (req.file) {
      const fileName = `prod-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
      const { error } = await supabase.storage.from('products').upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
      image_url = publicUrlData.publicUrl;
    }

    const result = await db.query(
      'UPDATE products SET title = $1, category = $2, sub_category = $3, original_price = $4, discount_price = $5, rating = $6, image_url = $7 WHERE id = $8',
      [title, category, sub_category || 'All', original_price, discount_price, rating || 5.0, image_url, id]
    );
    productsCache = null; // Invalidate cache
    res.json({ success: true, changes: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a product (admin only)
app.delete('/api/admin/products/:id', requireAdmin(), async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query('DELETE FROM products WHERE id = $1', [id]);
    productsCache = null; // Invalidate cache
    res.json({ success: true, changes: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Gallery APIs ---
app.get('/api/gallery', async (req, res) => {
  try {
    let query = 'SELECT * FROM gallery_images ORDER BY id DESC';
    const params = [];
    if (req.query.limit) {
      query += ' LIMIT $1';
      params.push(parseInt(req.query.limit, 10));
    }
    const { rows } = await db.query(query, params);
    res.json({ gallery: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/gallery', requireAdmin(), upload.single('image'), async (req, res) => {
  const { title } = req.body;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const fileName = `gal-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
    const { error } = await supabase.storage.from('products').upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true
    });
    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
    const image_url = publicUrlData.publicUrl;

    const result = await db.query(
      'INSERT INTO gallery_images (title, image_url) VALUES ($1, $2) RETURNING *',
      [title || 'Gallery Image', image_url]
    );
    res.json({ success: true, image: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/gallery/:id', requireAdmin(), async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query('DELETE FROM gallery_images WHERE id = $1', [id]);
    res.json({ success: true, changes: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Wishlist APIs ---
app.get('/api/users/wishlist', requireAuth(), async (req, res) => {
  const userId = req.auth.id;
  
  try {
    const { rows } = await db.query(`
      SELECT p.* FROM products p
      JOIN wishlists w ON p.id = w.product_id
      WHERE w.user_id = $1
    `, [userId]);
    res.json({ wishlist: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/wishlist', requireAuth(), async (req, res) => {
  const userId = req.auth.id;
  const { product_id } = req.body;
  
  try {
    await db.query('INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2)', [userId, product_id]);
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Product already in wishlist' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/wishlist/:productId', requireAuth(), async (req, res) => {
  const userId = req.auth.id;
  const product_id = req.params.productId;
  
  try {
    const result = await db.query('DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2', [userId, product_id]);
    res.json({ success: true, changes: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin Banner Settings APIs ---
app.get('/api/settings/banner', async (req, res) => {
  try {
    const { rows } = await db.query("SELECT value FROM settings WHERE key = 'promo_banner'");
    res.json({ banner: rows[0] ? rows[0].value : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/settings/banner', requireAdmin(), async (req, res) => {
  const { banner_text } = req.body;
  try {
    await db.query(
      "INSERT INTO settings (key, value) VALUES ('promo_banner', $1) ON CONFLICT(key) DO UPDATE SET value = $2",
      [banner_text, banner_text]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin Insights APIs ---
app.get('/api/admin/insights/wishlists', requireAdmin(), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.id, p.title, p.image_url, COUNT(w.user_id) as wishlist_count
      FROM products p
      JOIN wishlists w ON p.id = w.product_id
      GROUP BY p.id
      ORDER BY wishlist_count DESC
    `);
    res.json({ insights: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Custom Design Upload API (Public) ---
app.post('/api/custom-design/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }
  
  try {
    const fileName = `custom-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
    const { error } = await supabase.storage.from('products').upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true
    });
    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
    res.json({ success: true, url: publicUrlData.publicUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// --- Smart Order API ---
app.post('/api/orders', upload.single('image'), async (req, res) => {
  const { product_id, customer_name, customer_phone, design_type, quantity, size, requirements } = req.body;
  
  const finalProductId = product_id ? parseInt(product_id, 10) : null;
  
  let reference_image_url = null;
  try {
    if (req.file) {
      const fileName = `order-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
      const { error } = await supabase.storage.from('products').upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
      reference_image_url = publicUrlData.publicUrl;
    }

    const result = await db.query(
      `INSERT INTO orders (product_id, customer_name, customer_phone, design_type, quantity, size, requirements, reference_image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [finalProductId, customer_name, customer_phone, design_type, quantity, size, requirements, reference_image_url]
    );
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin Orders APIs ---
app.get('/api/admin/orders', requireAdmin(), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT o.*, p.title as product_title 
      FROM orders o 
      LEFT JOIN products p ON o.product_id = p.id 
      ORDER BY o.created_at DESC
    `);
    res.json({ orders: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/orders/:id/status', requireAdmin(), async (req, res) => {
  const { status } = req.body;
  try {
    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
