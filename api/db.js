import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export default sql

// Initialize database schema
export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS inspections (
      id SERIAL PRIMARY KEY,
      uuid UUID DEFAULT gen_random_uuid() UNIQUE,
      trailer_number VARCHAR(100),
      container_number VARCHAR(100),
      seal_number VARCHAR(100),
      lock_number VARCHAR(100),
      driver_name VARCHAR(200),
      odometer VARCHAR(50),
      location VARCHAR(200),
      inspection_date TIMESTAMP,
      high_security_seal VARCHAR(10),
      seal_affixed VARCHAR(10),
      guard_name VARCHAR(200),
      guard_signature TEXT,
      guard_signed_at TIMESTAMP,
      auditor_name VARCHAR(200),
      auditor_signature TEXT,
      auditor_signed_at TIMESTAMP,
      seal_photo TEXT,
      pdf_data TEXT,
      pdf_filename VARCHAR(255),
      language VARCHAR(10) DEFAULT 'es',
      good_count INTEGER DEFAULT 0,
      bad_count INTEGER DEFAULT 0,
      pending_count INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      original_inspection_id INTEGER REFERENCES inspections(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS inspection_points (
      id SERIAL PRIMARY KEY,
      inspection_id INTEGER REFERENCES inspections(id) ON DELETE CASCADE,
      point_id INTEGER NOT NULL,
      status VARCHAR(20),
      issue_id INTEGER,
      issue_text TEXT,
      photo TEXT,
      ai_verified BOOLEAN DEFAULT FALSE,
      ai_confidence INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      inspection_id INTEGER REFERENCES inspections(id) ON DELETE CASCADE,
      action VARCHAR(100),
      actor_name VARCHAR(200),
      details JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_inspections_uuid ON inspections(uuid)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_inspections_trailer ON inspections(trailer_number)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_inspections_created ON inspections(created_at DESC)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_inspection_points_inspection ON inspection_points(inspection_id)
  `

  return { success: true, message: 'Database initialized' }
}
