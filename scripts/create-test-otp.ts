import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL!);

async function createTestOTP() {
  try {
    console.log('Creating test OTP code...');
    
    // Check if code already exists
    const existingCode = await sql`
      SELECT * FROM otpcode WHERE code = '123456'
    `;
    
    if (existingCode.length > 0) {
      console.log('✓ Test OTP code already exists');
      console.log('OTP Code: 123456');
      return;
    }
    
    // Create test OTP code
    await sql`
      INSERT INTO otpcode (code)
      VALUES ('123456')
    `;
    
    console.log('✓ Test OTP code created successfully');
    console.log('OTP Code: 123456');
  } catch (error) {
    console.error('Error creating test OTP code:', error);
    process.exit(1);
  }
}

createTestOTP();
