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
      console.log('PDF download request for ID:', id, 'Type:', typeof id)

      // Clean ID - remove .pdf extension if present
      const cleanId = String(id).replace(/\.pdf$/, '')
      const inspectionId = parseInt(cleanId)

      if (isNaN(inspectionId)) {
        console.error('Invalid inspection ID:', id, 'Cleaned:', cleanId)
        return res.status(400).json({ error: 'Invalid inspection ID' })
      }

      const [inspection] = await sql`
        SELECT pdf_filename, pdf_data, trailer_number, seal_number, lock_number, driver_name, location, inspection_date, inspection_type, trailer_type, guard_name, guard_signature, guard_signed_at, supervisor_name, supervisor_signature, supervisor_signed_at, operator_name, operator_signature, language, tractor_number, container_number, equipment_nomenclature, customer_prefix, odometer, high_security_seal, seal_affixed, wono
        FROM inspections
        WHERE id = ${inspectionId}
      `

      console.log('Inspection found:', !!inspection, 'Has PDF data:', !!(inspection?.pdf_data))
      console.log('PDF data type:', typeof inspection?.pdf_data, 'Length:', inspection?.pdf_data?.length || 0)
      console.log('PDF data is Buffer:', Buffer.isBuffer(inspection?.pdf_data))

      if (!inspection) {
        return res.status(404).json({ error: 'Inspection not found' })
      }

      if (inspection.pdf_data) {
        // Return stored PDF as binary buffer
        let pdfData = inspection.pdf_data
        console.log('pdfData before processing - type:', typeof pdfData, 'isBuffer:', Buffer.isBuffer(pdfData))
        // Remove data:application/pdf;base64, prefix if present
        if (typeof pdfData === 'string') {
          console.log('Removing data URI prefix from string PDF')
          pdfData = pdfData.replace(/^data:application\/pdf(;[^,]*)?;base64,/, '')
        }
        const pdfBuffer = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData, 'base64')
        console.log('PDF buffer length:', pdfBuffer.length, 'First 20 bytes:', pdfBuffer.slice(0, 20).toString('hex'))
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="${inspection.pdf_filename || `inspection-${id}.pdf`}"`)
        res.setHeader('Content-Length', pdfBuffer.length)
        return res.status(200).end(pdfBuffer)
      }

      // PDF not stored - let frontend generate it
      return res.status(404).json({ error: 'PDF not available in database - frontend will generate it' })
    }

    if (req.method === 'GET') {
      // Get inspection by ID or UUID
      // Clean ID - remove .pdf extension if present
      const cleanId = String(id).replace(/\.pdf$/, '')
      const isUuid = cleanId.includes('-')

      const inspections = isUuid
        ? await sql`SELECT * FROM inspections WHERE uuid = ${cleanId}`
        : await sql`SELECT * FROM inspections WHERE id = ${parseInt(cleanId)}`

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
      const { name, signature, signedAt, pdfBase64, pdfFilename } = req.body

      if (!name || !signedAt) {
        return res.status(400).json({ error: 'Name and signedAt are required' })
      }

      // Clean ID - remove .pdf extension if present
      const cleanId = String(id).replace(/\.pdf$/, '')
      const inspectionId = parseInt(cleanId)

      // Prepare PDF update if provided
      let pdfUpdate = ''
      let pdfBuffer = null
      if (pdfBase64) {
        const pdfDataB64 = String(pdfBase64).replace(/^data:application\/pdf;base64,/, '')
        pdfBuffer = Buffer.from(pdfDataB64, 'base64')
        pdfUpdate = `, pdf_filename = ${pdfFilename || 'inspection.pdf'}, pdf_data = ${pdfBuffer}, pdf_size_bytes = ${pdfBuffer.length}`
      }

      // Update inspection with supervisor signature and mark as completed
      const result = await sql`
        UPDATE inspections
        SET supervisor_name = ${name},
            supervisor_signature = ${signature || null},
            supervisor_signed_at = ${signedAt},
            status = 'completed',
            updated_at = NOW()
            ${sql.unsafe(pdfUpdate)}
        WHERE id = ${inspectionId}
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
