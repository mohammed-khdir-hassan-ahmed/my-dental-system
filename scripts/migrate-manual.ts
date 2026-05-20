import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL!);

async function runMigration() {
  try {
    console.log('Creating installment tables...');
    
    // Create the installment_status enum if it doesn't exist
    try {
      await sql.query(`CREATE TYPE "installment_status" AS ENUM('Paid', 'Pending', 'Overdue')`);
      console.log('✓ Created installment_status enum');
    } catch (e: any) {
      if (e.code !== '42710') {
        console.log('installment_status enum already exists or error:', e.message);
      }
    }
    
    // Create installments table if it doesn't exist
    try {
      await sql.query(`
        CREATE TABLE IF NOT EXISTS "installments" (
          "id" serial PRIMARY KEY NOT NULL,
          "patient_name" text NOT NULL,
          "total_amount" numeric(10, 2) NOT NULL,
          "paid_amount" numeric(10, 2) DEFAULT '0',
          "remaining_amount" numeric(10, 2) NOT NULL,
          "installment_value" numeric(10, 2) NOT NULL,
          "next_payment_date" date,
          "status" "installment_status" DEFAULT 'Pending',
          "age" text,
          "phone_number" text,
          "address" text,
          "created_at" timestamp DEFAULT now()
        )
      `);
      console.log('✓ Created installments table');
    } catch (e: any) {
      console.log('Error creating installments table:', e.message);
    }

    // Add new columns to installments table if they don't exist
    try {
      await sql.query(`ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "age" text`);
      console.log('✓ Added age column');
    } catch (e: any) {
      console.log('Error adding age column:', e.message);
    }

    try {
      await sql.query(`ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "phone_number" text`);
      console.log('✓ Added phone_number column');
    } catch (e: any) {
      console.log('Error adding phone_number column:', e.message);
    }

    try {
      await sql.query(`ALTER TABLE "installments" ADD COLUMN IF NOT EXISTS "address" text`);
      console.log('✓ Added address column');
    } catch (e: any) {
      console.log('Error adding address column:', e.message);
    }
    
    // Create payment_history table if it doesn't exist
    try {
      await sql.query(`
        CREATE TABLE IF NOT EXISTS "payment_history" (
          "id" serial PRIMARY KEY NOT NULL,
          "installment_id" integer NOT NULL,
          "amount_paid" numeric(10, 2) NOT NULL,
          "payment_date" date NOT NULL,
          "created_at" timestamp DEFAULT now()
        )
      `);
      console.log('✓ Created payment_history table');
    } catch (e: any) {
      console.log('Error creating payment_history table:', e.message);
    }
    
    // Add foreign key constraint if it doesn't exist
    try {
      await sql.query(`
        ALTER TABLE "payment_history" 
        ADD CONSTRAINT "payment_history_installment_id_installments_id_fk" 
        FOREIGN KEY ("installment_id") REFERENCES "public"."installments"("id") 
        ON DELETE no action ON UPDATE no action
      `);
      console.log('✓ Added foreign key constraint');
    } catch (e: any) {
      if (e.code !== '42710') {
        console.log('Foreign key constraint already exists or error:', e.message);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
