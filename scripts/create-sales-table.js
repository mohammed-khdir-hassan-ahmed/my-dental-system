import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Creating sales_table...');
    
    // Create table first
    await sql`
      CREATE TABLE IF NOT EXISTS sales_table (
        id SERIAL PRIMARY KEY,
        product_name TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        price NUMERIC(12, 2) NOT NULL,
        cost NUMERIC(12, 2) NOT NULL,
        quantity INTEGER DEFAULT 1 NOT NULL,
        total_price NUMERIC(12, 2) NOT NULL,
        total_cost NUMERIC(12, 2) NOT NULL,
        profit NUMERIC(12, 2) NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Table created');
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_table(date)`;
    console.log('✅ Index idx_sales_date created');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_category ON sales_table(category)`;
    console.log('✅ Index idx_sales_category created');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_product_name ON sales_table(product_name)`;
    console.log('✅ Index idx_sales_product_name created');
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
