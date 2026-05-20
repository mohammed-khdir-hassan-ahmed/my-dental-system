import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Removing cost columns from sales_table...');
    
    await sql`ALTER TABLE sales_table DROP COLUMN IF EXISTS cost`;
    console.log('✅ Column cost dropped');
    
    await sql`ALTER TABLE sales_table DROP COLUMN IF EXISTS total_cost`;
    console.log('✅ Column total_cost dropped');
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
