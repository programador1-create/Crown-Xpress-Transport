import { getSql } from '../_lib/db.js'
import { generateInspectionPDF } from '../_lib/pdfGenerator.js'

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

      // Prepare PDF update if provided; otherwise regenerate in backend to avoid huge frontend payloads
      let pdfUpdate = {}
      if (pdfBase64) {
        console.log('pdfBase64 starts with data:application/pdf?', pdfBase64.startsWith('data:application/pdf'))
        console.log('pdfBase64 first 100 chars:', pdfBase64.substring(0, 100))
        // Remove data URI prefix - handle both with and without filename parameter
        const pdfDataB64 = String(pdfBase64).replace(/^data:application\/pdf(;[^,]*)?;base64,/, '')
        console.log('pdfDataB64 length after removing prefix:', pdfDataB64.length)
        console.log('pdfDataB64 first 100 chars:', pdfDataB64.substring(0, 100))
        const pdfBuffer = Buffer.from(pdfDataB64, 'base64')
        console.log('PDF buffer length:', pdfBuffer.length)
        pdfUpdate = {
          pdf_filename: pdfFilename || 'inspection.pdf',
          pdf_data: pdfBuffer,
          pdf_size_bytes: pdfBuffer.length
        }
      } else {
        console.log('Regenerating PDF in backend after supervisor signature...')
        try {
          const [fullInspection] = await sql`SELECT * FROM inspections WHERE id = ${inspectionId}`
          const fullPoints = await sql`
            SELECT point_id, status, issue_id, issue_text, photo
            FROM inspection_points
            WHERE inspection_id = ${inspectionId}
            ORDER BY point_id
          `
          if (fullInspection) {
            const unitInfo = {
              trailerNumber: fullInspection.trailer_number,
              tractorNumber: fullInspection.tractor_number,
              containerNumber: fullInspection.container_number,
              equipmentNomenclature: fullInspection.equipment_nomenclature,
              customerPrefix: fullInspection.customer_prefix,
              sealNumber: fullInspection.seal_number,
              lockNumber: fullInspection.lock_number,
              driverName: fullInspection.driver_name,
              odometer: fullInspection.odometer,
              location: fullInspection.location,
              inspectionDate: fullInspection.inspection_date,
              highSecuritySeal: fullInspection.high_security_seal,
              sealAffixed: fullInspection.seal_affixed,
              inspectionType: fullInspection.inspection_type,
              trailerType: fullInspection.trailer_type || (fullInspection.inspection_type === 'BOBTAIL' ? 'BOBTAIL' : null),
              workOrder: fullInspection.wono
            }
            const pointsObj = {}
            for (const p of fullPoints) {
              pointsObj[p.point_id] = {
                status: p.status,
                issueId: p.issue_id,
                issueCustomText: p.issue_text,
                photo: p.photo
              }
            }
            const pdfResult = await generateInspectionPDF({
              unitInfo,
              points: pointsObj,
              sealPhoto: fullInspection.seal_photo,
              guardSignature: fullInspection.guard_name ? { name: fullInspection.guard_name, signature: fullInspection.guard_signature, signedAt: fullInspection.guard_signed_at } : null,
              supervisorSignature: { name, signature, signedAt },
              operatorSignature: fullInspection.operator_name ? { name: fullInspection.operator_name, signature: fullInspection.operator_signature, signedAt: fullInspection.operator_signed_at } : null,
              language: fullInspection.language || 'es',
              yardCode: fullInspection.location || ''
            })
            const pdfBase64Generated = pdfResult.doc.output('datauristring')
            const pdfDataB64 = String(pdfBase64Generated).replace(/^data:application\/pdf(;[^,]*)?;base64,/, '')
            const pdfBuffer = Buffer.from(pdfDataB64, 'base64')
            pdfUpdate = {
              pdf_filename: pdfResult.filename,
              pdf_data: pdfBuffer,
              pdf_size_bytes: pdfBuffer.length
            }
            console.log('Backend PDF regenerated, size:', pdfBuffer.length, 'bytes')
          }
        } catch (pdfError) {
          console.error('Error regenerating PDF in backend:', pdfError)
          console.error('Error regenerating PDF in backend stack:', pdfError.stack)
          // Continue without updating PDF; supervisor signature is still saved
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
