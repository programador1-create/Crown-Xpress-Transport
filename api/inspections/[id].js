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
        SELECT pdf_filename, pdf_data::bytea as pdf_data, trailer_number, seal_number, lock_number, driver_name, location, inspection_date, inspection_type, trailer_type, guard_name, guard_signature, guard_signed_at, supervisor_name, supervisor_signature, supervisor_signed_at, operator_name, operator_signature, language, tractor_number, container_number, equipment_nomenclature, customer_prefix, odometer, high_security_seal, seal_affixed, wono
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
        console.log('pdfData length:', pdfData?.length || 0)
        let pdfBuffer
        if (Buffer.isBuffer(pdfData)) {
          pdfBuffer = pdfData
          console.log('Using Buffer directly')
        } else if (typeof pdfData === 'string') {
          // Try to detect if it's base64 or hex
          if (pdfData.startsWith('data:application/pdf')) {
            console.log('Removing data URI prefix from string PDF')
            pdfData = pdfData.replace(/^data:application\/pdf(;[^,]*)?;base64,/, '')
            pdfBuffer = Buffer.from(pdfData, 'base64')
            console.log('Decoded as base64 after removing prefix')
          } else if (pdfData.match(/^[0-9a-fA-F]+$/)) {
            console.log('Decoding as hex string')
            pdfBuffer = Buffer.from(pdfData, 'hex')
          } else {
            console.log('Decoding as base64 string')
            pdfBuffer = Buffer.from(pdfData, 'base64')
          }
        } else {
          console.log('Unknown type, trying to convert to buffer')
          pdfBuffer = Buffer.from(pdfData)
        }

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

      console.log('POST /api/inspections/[id] - Supervisor signature request')
      console.log('Name:', name)
      console.log('Has signature:', !!signature)
      console.log('Signature length:', signature?.length || 0)
      console.log('SignedAt:', signedAt)
      console.log('Has pdfBase64:', !!pdfBase64)
      console.log('pdfBase64 length:', pdfBase64?.length || 0)

      if (!name || !signedAt) {
        return res.status(400).json({ error: 'Name and signedAt are required' })
      }

      // Clean ID - remove .pdf extension if present
      const cleanId = String(id).replace(/\.pdf$/, '')
      const inspectionId = parseInt(cleanId)

      // Prepare PDF update only if provided by frontend. We DO NOT regenerate the
      // PDF in the backend here because it is heavy (jsPDF + images) and can time
      // out on serverless, causing the supervisor signature to fail to save.
      // The frontend uploads the regenerated PDF separately via PUT /pdf.
      let pdfUpdate = {}
      if (pdfBase64) {
        const pdfDataB64 = String(pdfBase64).replace(/^data:application\/pdf(;[^,]*)?;base64,/, '')
        const pdfBuffer = Buffer.from(pdfDataB64, 'base64')
        console.log('Supervisor sign - PDF provided, size:', pdfBuffer.length)
        pdfUpdate = {
          pdf_filename: pdfFilename || 'inspection.pdf',
          pdf_data: pdfBuffer,
          pdf_size_bytes: pdfBuffer.length
        }
      }

      // Update inspection with supervisor signature and mark as completed
      const result = await sql`
        UPDATE inspections
        SET supervisor_name = ${name},
            supervisor_signature = ${signature || null},
            supervisor_signed_at = ${signedAt},
            status = 'completed',
            updated_at = NOW()
            ${Object.keys(pdfUpdate).length > 0 ? sql`, pdf_filename = ${pdfUpdate.pdf_filename}, pdf_data = ${pdfUpdate.pdf_data}, pdf_size_bytes = ${pdfUpdate.pdf_size_bytes}` : sql``}
        WHERE id = ${inspectionId}
        RETURNING *
      `

      console.log('Update result:', result.length > 0 ? 'Success' : 'Failed')
      if (result.length > 0) {
        console.log('Updated supervisor_name:', result[0].supervisor_name)
        console.log('Updated supervisor_signature length:', result[0].supervisor_signature?.length || 0)
      }

      if (result.length === 0) {
        return res.status(404).json({ error: 'Inspection not found' })
      }

      return res.status(200).json({
        message: 'Supervisor signature added successfully',
        inspection: result[0]
      })
    }

    if (req.method === 'PUT') {
      const { pdfBase64, pdfFilename } = req.body
      if (!pdfBase64) {
        return res.status(400).json({ error: 'pdfBase64 required' })
      }

      // id may be '56' or '56/pdf' depending on how Vercel routes it
      const rawId = String(id).replace(/\/pdf$/, '').replace(/\.pdf$/, '')
      const inspectionId = parseInt(rawId)
      if (isNaN(inspectionId)) {
        return res.status(400).json({ error: 'Invalid inspection ID' })
      }

      const pdfDataB64 = String(pdfBase64).replace(/^data:application\/pdf(;[^,]*)?;base64,/, '')
      const pdfBuffer = Buffer.from(pdfDataB64, 'base64')

      console.log('PUT /api/inspections/[id] - Uploading PDF, size:', pdfBuffer.length, 'bytes')

      const [updated] = await sql`
        UPDATE inspections
        SET pdf_filename = ${pdfFilename || 'inspection.pdf'},
            pdf_data = ${pdfBuffer},
            pdf_size_bytes = ${pdfBuffer.length},
            updated_at = NOW()
        WHERE id = ${inspectionId}
        RETURNING id
      `

      if (!updated) {
        return res.status(404).json({ error: 'Inspection not found' })
      }

      return res.status(200).json({ success: true, pdfSize: pdfBuffer.length })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
