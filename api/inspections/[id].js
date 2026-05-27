import sql from '../db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
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

    // Handle PDF endpoint
    if (req.url?.includes('/pdf') && req.method === 'GET') {
      const isUuid = id.includes('-')
      
      const inspections = isUuid
        ? await sql`SELECT pdf_data, pdf_filename FROM inspections WHERE uuid = ${id}`
        : await sql`SELECT pdf_data, pdf_filename FROM inspections WHERE id = ${parseInt(id)}`

      if (inspections.length === 0 || !inspections[0].pdf_data) {
        return res.status(404).json({ error: 'PDF not found' })
      }

      const { pdf_data, pdf_filename } = inspections[0]
      
      // Remove data URI prefix if present and convert to buffer
      let base64Data = pdf_data
      if (pdf_data.includes(',')) {
        base64Data = pdf_data.split(',')[1]
      }
      const pdfBuffer = Buffer.from(base64Data, 'base64')

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${pdf_filename || 'inspection.pdf'}"`)
      res.setHeader('Content-Length', pdfBuffer.length)

      return res.send(pdfBuffer)
    }

    // Handle reconfirm endpoint
    if (req.url?.includes('/reconfirm') && req.method === 'POST') {
      const isUuid = id.includes('-')
      
      // Get original inspection
      const originals = isUuid
        ? await sql`SELECT id FROM inspections WHERE uuid = ${id}`
        : await sql`SELECT id FROM inspections WHERE id = ${parseInt(id)}`

      if (originals.length === 0) {
        return res.status(404).json({ error: 'Original inspection not found' })
      }

      const originalId = originals[0].id
      const {
        unitInfo,
        points,
        guardSignature,
        auditorSignature,
        language,
        pdfBase64,
        pdfFilename,
        counts,
        sealPhoto
      } = req.body

      // Create reconfirmation inspection
      const [inspection] = await sql`
        INSERT INTO inspections (
          trailer_number, container_number, seal_number, lock_number,
          driver_name, odometer, location, inspection_date,
          high_security_seal, seal_affixed,
          guard_name, guard_signature, guard_signed_at,
          auditor_name, auditor_signature, auditor_signed_at,
          seal_photo, pdf_data, pdf_filename,
          language, good_count, bad_count, pending_count,
          status, original_inspection_id
        ) VALUES (
          ${unitInfo?.trailerNumber || null},
          ${unitInfo?.containerNumber || null},
          ${unitInfo?.sealNumber || null},
          ${unitInfo?.lockNumber || null},
          ${unitInfo?.driverName || null},
          ${unitInfo?.odometer || null},
          ${unitInfo?.location || null},
          ${unitInfo?.inspectionDate ? new Date(unitInfo.inspectionDate) : new Date()},
          ${unitInfo?.highSecuritySeal || 'no'},
          ${unitInfo?.sealAffixed || 'no'},
          ${guardSignature?.name || null},
          ${guardSignature?.signature || null},
          ${guardSignature?.signedAt ? new Date(guardSignature.signedAt) : null},
          ${auditorSignature?.name || null},
          ${auditorSignature?.signature || null},
          ${auditorSignature?.signedAt ? new Date(auditorSignature.signedAt) : null},
          ${sealPhoto || null},
          ${pdfBase64 || null},
          ${pdfFilename || null},
          ${language || 'es'},
          ${counts?.good || 0},
          ${counts?.bad || 0},
          ${counts?.pending || 0},
          'reconfirmed',
          ${originalId}
        )
        RETURNING id, uuid, created_at
      `

      // Insert inspection points
      if (points && typeof points === 'object') {
        for (const [pointId, pointData] of Object.entries(points)) {
          await sql`
            INSERT INTO inspection_points (
              inspection_id, point_id, status, issue_id, issue_text, photo
            ) VALUES (
              ${inspection.id},
              ${parseInt(pointId)},
              ${pointData.status || null},
              ${pointData.issueId || null},
              ${pointData.issueText || null},
              ${pointData.photo || null}
            )
          `
        }
      }

      // Create audit log
      await sql`
        INSERT INTO audit_logs (inspection_id, action, actor_name, details)
        VALUES (
          ${inspection.id},
          'reconfirmed',
          ${guardSignature?.name || 'Unknown'},
          ${JSON.stringify({ originalId, counts, language })}
        )
      `

      // Count modified points
      const modifiedCount = points ? Object.values(points).filter(p => p.modified).length : 0

      return res.status(201).json({
        success: true,
        id: inspection.id,
        uuid: inspection.uuid,
        originalId,
        modifications: modifiedCount,
        createdAt: inspection.created_at
      })
    }

    // Handle chain endpoint
    if (req.url?.includes('/chain') && req.method === 'GET') {
      const isUuid = id.includes('-')
      
      // Get the inspection
      const inspections = isUuid
        ? await sql`SELECT * FROM inspections WHERE uuid = ${id}`
        : await sql`SELECT * FROM inspections WHERE id = ${parseInt(id)}`

      if (inspections.length === 0) {
        return res.status(404).json({ error: 'Inspection not found' })
      }

      const inspection = inspections[0]
      
      // Find the root inspection (original)
      let rootId = inspection.id
      if (inspection.original_inspection_id) {
        // This is a reconfirmation, find the original
        const originals = await sql`
          SELECT id FROM inspections 
          WHERE id = ${inspection.original_inspection_id}
        `
        if (originals.length > 0) {
          rootId = originals[0].id
        }
      }

      // Get all inspections in the chain
      const chain = await sql`
        SELECT 
          id, uuid, trailer_number, driver_name, 
          guard_name, guard_signed_at,
          auditor_name, auditor_signed_at,
          good_count, bad_count, pending_count,
          status, original_inspection_id, created_at
        FROM inspections 
        WHERE id = ${rootId} OR original_inspection_id = ${rootId}
        ORDER BY created_at ASC
      `

      return res.status(200).json({
        original: chain.find(i => !i.original_inspection_id),
        reconfirmations: chain.filter(i => i.original_inspection_id),
        total: chain.length
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
