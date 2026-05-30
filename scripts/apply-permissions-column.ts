import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'

config()

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  await sql`ALTER TABLE users_table ADD COLUMN IF NOT EXISTS permissions text`
  console.log('کۆڵۆمی permissions زیادکرا')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
