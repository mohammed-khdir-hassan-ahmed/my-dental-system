import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL!);

async function runMigration() {
  try {
    console.log('Creating otpcode table...');
    
    // Create otpcode table if it doesn't exist
    try {
      await sql.query(`
        CREATE TABLE IF NOT EXISTS "otpcode" (
          "id" serial PRIMARY KEY NOT NULL,
          "code" varchar(10) NOT NULL,
          "created_at" timestamp DEFAULT now(),
          CONSTRAINT "otpcode_code_unique" UNIQUE("code")
        )
      `);
      console.log('✓ Created otpcode table');
    } catch (e: any) {
      console.log('Error creating otpcode table:', e.message);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
