import { neon } from '@neondatabase/serverless'
// Note: This utility still uses Neon driver for one-time maintenance on Neon DB
// If running against IONOS, use: import pg from 'pg' and new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })

const sql = neon('postgresql://neondb_owner:npg_1FhPVkX3wISq@ep-polished-queen-axrtw0ec-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require')

async function main() {
  // 1. Verificar si pdf_url existe
  const cols = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'inspections' AND column_name = 'pdf_url'
  `
  console.log('pdf_url existe?', JSON.stringify(cols, null, 2))

  if (cols.length === 0) {
    console.log('Agregando columna pdf_url a inspections...')
    await sql`ALTER TABLE inspections ADD COLUMN pdf_url text`
    console.log('Columna pdf_url agregada (text, nullable)')
  } else {
    console.log('La columna pdf_url ya existe, no se necesita crear')
  }

  // 2. Verificar que quedó agregada
  const verify = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'inspections' AND column_name = 'pdf_url'
  `
  console.log('Verificacion:', JSON.stringify(verify, null, 2))

  // 3. Verificar si hay inspecciones con pdf_url ya poblado
  const withUrl = await sql`SELECT count(*)::int AS cnt FROM inspections WHERE pdf_url IS NOT NULL`
  console.log('Inspecciones con pdf_url poblado:', withUrl[0].cnt)

  // 4. Verificar si hay inspecciones con pdf_data (legacy)
  const withData = await sql`SELECT count(*)::int AS cnt FROM inspections WHERE pdf_data IS NOT NULL`
  console.log('Inspecciones con pdf_data (legacy):', withData[0].cnt)

  console.log('\nCorreccion completada.')
}

main().catch(e => console.error('ERROR:', e))
