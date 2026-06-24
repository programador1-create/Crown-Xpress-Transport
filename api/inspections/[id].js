import { getSql } from '../_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Check both req.query and req.params for id (Express compatibility)
  const id = req.query.id || req.params.id

  try {
    const sql = getSql()

    // PDF download endpoint
    if (req.method === 'GET' && req.query.pdf === 'true') {
      const [inspection] = await sql`
        SELECT pdf_filename, pdf_data
        FROM inspections
        WHERE id = ${parseInt(id)}
      `

      if (!inspection) {
        return res.status(404).json({ error: 'Inspection not found' })
      }

      if (!inspection.pdf_data) {
        return res.status(404).json({ error: 'PDF not available' })
      }

      const pdfBuffer = inspection.pdf_data

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${inspection.pdf_filename || `inspection-${id}.pdf`}"`)
      return res.send(pdfBuffer)
    }

    if (req.method === 'GET') {
      // Get inspection by ID or UUID
      const isUuid = id.includes('-')

      const inspections = isUuid
        ? await sql`SELECT * FROM inspections WHERE uuid = ${id}`
        : await sql`SELECT * FROM inspections WHERE id = ${parseInt(id)}`

      if (inspections.length === 0) {
        return res.status(404).json({ error: 'Inspection not found' })
      }

      const inspection = inspections[0]

      // Get points
      const points = await sql`
        SELECT point_id, status, issue_id, issue_text, photo
        FROM inspection_points
        WHERE inspection_id = ${inspection.id}
        ORDER BY point_id
      `

      // Get audit logs
      const audits = await sql`
        SELECT * FROM audit_log
        WHERE inspection_id = ${inspection.id}
        ORDER BY created_at DESC
      `

      return res.status(200).json({
        inspection,
        points,
        audits
      })
    }

    if (req.method === 'POST') {
      const { name, signature, signedAt } = req.body

      if (!name || !signedAt) {
        return res.status(400).json({ error: 'Name and signedAt are required' })
      }

      // Update inspection with supervisor signature and mark as completed
      const result = await sql`
        UPDATE inspections
        SET supervisor_name = ${name},
            supervisor_signature = ${signature || null},
            supervisor_signed_at = ${signedAt},
            status = 'completed',
            updated_at = NOW()
        WHERE id = ${parseInt(id)}
        RETURNING *
      `

      if (result.length === 0) {
        return res.status(404).json({ error: 'Inspection not found' })
      }

      return res.status(200).json({
        message: 'Supervisor signature added successfully',
        inspection: result[0]
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
