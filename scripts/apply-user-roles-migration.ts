import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { readFileSync } from 'fs'

config()

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  const migration = readFileSync('migrations/0010_user_roles_permissions.sql', 'utf8')
  const statements = migration
    .split(';')
    .map((s) => s.replace(/--[^\n]*/g, '').trim())
    .filter(Boolean)

  for (const statement of statements) {
    await sql.query(statement)
    console.log('OK:', statement.slice(0, 60).replace(/\s+/g, ' ') + '...')
  }

  console.log('Migration 0010 applied successfully')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
