import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'

config()

const sql = neon(process.env.DATABASE_URL!)

async function createPushSubscriptionsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `
    console.log('✅ push_subscriptions table created successfully!')
  } catch (error) {
    console.error('❌ Error creating table:', error)
  }
}

createPushSubscriptionsTable()
