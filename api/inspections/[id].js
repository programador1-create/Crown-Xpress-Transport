// import sql from '../_lib/db.js'
// import { generatePDF } from '../_lib/pdf-generator.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query
  console.log('Endpoint called:', req.method, req.url, 'ID:', id)

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

    // Handle PDF generation (GET request)
    if (req.method === 'GET' && req.url.includes('pdf')) {
      try {
        const pdfBuffer = await generatePDF(parseInt(id))
        if (!pdfBuffer) {
          return res.status(500).json({ error: 'PDF generation failed - no data returned' })
        }
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="inspection-${id}.pdf"`)
        return res.status(200).send(pdfBuffer)
      } catch (error) {
        console.error('PDF generation error:', error)
        return res.status(500).json({ 
          error: 'Failed to generate PDF',
          details: error.message 
        })
      }
    }

    if (req.method === 'POST') {
      console.log('POST request received:', req.url)
      // Check if this is a supervisor signature request
      const isSupervisorSignature = req.url.includes('sign-supervisor')
      console.log('Is supervisor signature request:', isSupervisorSignature)
      
      if (isSupervisorSignature) {
        console.log('Processing supervisor signature for inspection:', id)
        console.log('Request body:', req.body)
        const { name, signedAt } = req.body
        
        if (!name || !signedAt) {
          return res.status(400).json({ error: 'Name and signedAt are required' })
        }

        try {
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

          console.log('Supervisor signature updated successfully for inspection:', id)
          return res.status(200).json({ 
            message: 'Supervisor signature added successfully',
            inspection: result[0]
          })
        } catch (dbError) {
          console.error('Database error in supervisor signature:', dbError)
          return res.status(500).json({ 
            error: 'Failed to update supervisor signature',
            details: dbError.message 
          })
        }
      }
      
      // Handle other POST requests if needed
      return res.status(405).json({ error: 'Method not allowed' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
