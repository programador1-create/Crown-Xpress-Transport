import sql from '../_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query

  try {
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
        SELECT * FROM inspection_points 
        WHERE inspection_id = ${inspection.id}
        ORDER BY point_id
      `

      // Get audit logs
      const audits = await sql`
        SELECT * FROM audit_logs 
        WHERE inspection_id = ${inspection.id}
        ORDER BY created_at DESC
      `

      return res.status(200).json({
        inspection,
        points,
        audits
      })
    }

    if (req.method === 'POST' && req.url.includes('sign-supervisor')) {
      const { name, signedAt } = req.body
      
      if (!name || !signedAt) {
        return res.status(400).json({ error: 'Name and signedAt are required' })
      }

      // Update inspection with supervisor signature
      const result = await sql`
        UPDATE inspections 
        SET supervisor_signature = ${name}, 
            supervisor_signed_at = ${signedAt},
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

    // GET - Download PDF
    if (req.method === 'GET' && req.url.endsWith('/pdf')) {
      try {
        const [inspection] = await sql`
          SELECT pdf_filename, pdf_base64 
          FROM inspections 
          WHERE id = ${parseInt(id)}
        `

        if (!inspection) {
          return res.status(404).json({ error: 'Inspection not found' })
        }

        if (!inspection.pdf_base64) {
          return res.status(404).json({ error: 'PDF not found' })
        }

        // Convert base64 back to binary
        const pdfBuffer = Buffer.from(inspection.pdf_base64, 'base64')
        
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${inspection.pdf_filename}"`)
        return res.send(pdfBuffer)
      } catch (error) {
        console.error('PDF Download Error:', error)
        return res.status(500).json({ error: 'Failed to download PDF' })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
