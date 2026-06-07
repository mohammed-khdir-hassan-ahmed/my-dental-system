import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  try {
    await sql`ALTER TABLE appointments_table ADD COLUMN IF NOT EXISTS teeth_data text DEFAULT NULL`;
    console.log('✅ Migration successful: teeth_data column added');
  } catch (e: any) {
    console.error('❌ Migration error:', e.message);
    process.exit(1);
  }
}

migrate();
