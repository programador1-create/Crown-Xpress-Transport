import { getSql } from './_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const sql = getSql()
    const rows = await sql`
      SELECT trailer_number, tractor_number, seal_number, lock_number, wono, created_at
      FROM inspections
      ORDER BY created_at DESC
      LIMIT 10
    `
    return res.json({ rows })
  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
