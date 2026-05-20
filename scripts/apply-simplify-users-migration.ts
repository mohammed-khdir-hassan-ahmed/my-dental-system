import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { readFileSync } from 'fs'

config()

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  const migration = readFileSync('migrations/0011_simplify_users_table.sql', 'utf8')
  const statements = migration
    .split(';')
    .map((s) => s.replace(/--[^\n]*/g, '').trim())
    .filter(Boolean)

  for (const statement of statements) {
    await sql.query(statement)
    console.log('OK:', statement)
  }

  const columns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'users_table'
    ORDER BY ordinal_position
  `

  console.log('\nکۆڵۆمەکانی users_table ئێستا:')
  for (const row of columns) {
    console.log(' -', row.column_name)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
