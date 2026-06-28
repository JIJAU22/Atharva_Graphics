const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function setup() {
  try {
    console.log('Creating products bucket...');
    await pool.query("INSERT INTO storage.buckets (id, name, public, avif_autodetection) VALUES ('products', 'products', true, false) ON CONFLICT (id) DO UPDATE SET public = true");
    
    console.log('Applying RLS policies...');
    try {
      await pool.query("CREATE POLICY \"Public Access\" ON storage.objects FOR SELECT TO public USING (bucket_id = 'products')");
      console.log('Public Access policy created.');
    } catch(e) { if(e.code !== '42710') throw e; else console.log('Public Access policy already exists.'); } 
    
    try {
      await pool.query("CREATE POLICY \"Public Upload\" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'products')");
      console.log('Public Upload policy created.');
    } catch(e) { if(e.code !== '42710') throw e; else console.log('Public Upload policy already exists.'); }
    
    console.log('Supabase Storage setup complete!');
  } catch(e) {
    console.error('Setup failed:', e);
  } finally {
    pool.end();
  }
}

setup();
