import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Read env from .env.local via vercel
const envPath = join(process.cwd(), '.env.local')
let dbUrl = ''
try {
  const content = readFileSync(envPath, 'utf8')
  const match = content.match(/^DATABASE_URL=(.+)$/m)
  if (match) dbUrl = match[1].replace(/^["']|["']$/g, '')
} catch(e) {}

if (!dbUrl) {
  // Try to get from vercel env
  const { execSync } = await import('child_process')
  try {
    dbUrl = execSync('npx vercel env pull --yes --environment=production 2>&1 && cat .env.local | grep DATABASE_URL', {encoding:'utf8'}).match(/DATABASE_URL=(.+)/)?.[1]
  } catch(e) {}
}

console.log('DB URL found:', !!dbUrl)

const { neon } = await import('@neondatabase/serverless')
const sql = neon(dbUrl)

const rows = await sql`
  SELECT trailer_number, tractor_number, seal_number, lock_number, wono, created_at 
  FROM inspections 
  ORDER BY created_at DESC 
  LIMIT 10
`
console.log('Recent inspections (last 10):')
rows.forEach(r => console.log(JSON.stringify(r)))
