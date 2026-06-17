import sql from '../db.js'

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
      // Handle PDF download via query param
      if (req.query.download === 'pdf') {
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
        if (typeof pdf_data === 'string' && pdf_data.includes(',')) {
          base64Data = pdf_data.split(',')[1]
        } else if (typeof pdf_data === 'string' && pdf_data.startsWith('data:')) {
          base64Data = pdf_data.replace(/^data:application\/pdf;base64,/, '')
        }
        
        const pdfBuffer = Buffer.from(base64Data, 'base64')

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${pdf_filename || 'inspection.pdf'}"`)
        res.setHeader('Content-Length', pdfBuffer.length)

        return res.send(pdfBuffer)
      }

      // Get inspection by ID or UUID (default)
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

    if (req.method === 'POST') {
      const { action } = req.body

      if (action === 'sign-supervisor') {
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

      if (action === 'reconfirm') {
        const {
          reason,
          points,
          guardSignature,
          language: lang,
          pdfBase64,
          pdfFilename
        } = req.body

        // Get original inspection
        const [original] = await sql`
          SELECT * FROM inspections WHERE id = ${id}
        `

        if (!original) {
          return res.status(404).json({ error: 'Original inspection not found' })
        }

        // Count modifications
        let modifications = 0
        if (points && typeof points === 'object') {
          for (const [pointId, pointData] of Object.entries(points)) {
            if (pointData.modified) {
              modifications++
            }
          }
        }

        // Calculate counts from points
        let goodCount = 0
        let badCount = 0
        let pendingCount = 0
        
        if (points && typeof points === 'object') {
          for (const pointData of Object.values(points)) {
            if (pointData.status === 'good') goodCount++
            else if (pointData.status === 'bad') badCount++
            else pendingCount++
          }
        }

        // Insert reconfirmation as new inspection linked to original
        const [reconfirmation] = await sql`
          INSERT INTO inspections (
            trailer_number, container_number, seal_number, lock_number,
            driver_name, odometer, location, inspection_date,
            high_security_seal, seal_affixed,
            guard_name, guard_signature, guard_signed_at,
            seal_photo, pdf_data, pdf_filename,
            language, good_count, bad_count, pending_count,
            status, original_inspection_id
          ) VALUES (
            ${original.trailer_number},
            ${original.container_number},
            ${original.seal_number},
            ${original.lock_number},
            ${original.driver_name},
            ${original.odometer},
            ${original.location},
            ${new Date()},
            ${original.high_security_seal},
            ${original.seal_affixed},
            ${guardSignature?.name || original.guard_name},
            ${guardSignature?.signature || null},
            ${guardSignature?.signedAt ? new Date(guardSignature.signedAt) : new Date()},
            ${original.seal_photo},
            ${pdfBase64 || null},
            ${pdfFilename || null},
            ${lang || 'es'},
            ${goodCount},
            ${badCount},
            ${pendingCount},
            'reconfirmed',
            ${id}
          )
          RETURNING id, uuid, created_at
        `

        // Insert reconfirmation points
        if (points && typeof points === 'object') {
          for (const [pointId, pointData] of Object.entries(points)) {
            await sql`
              INSERT INTO inspection_points (
                inspection_id, point_id, status, issue_id, issue_text, photo
              ) VALUES (
                ${reconfirmation.id},
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
            ${reconfirmation.id},
            'reconfirmed',
            ${guardSignature?.name || 'Unknown'},
            ${JSON.stringify({ 
              reason, 
              modifications,
              original_id: id,
              good_count: goodCount,
              bad_count: badCount
            })}
          )
        `

        return res.status(201).json({
          success: true,
          id: reconfirmation.id,
          uuid: reconfirmation.uuid,
          createdAt: reconfirmation.created_at,
          modifications,
          original_id: id
        })
      }

      return res.status(400).json({ error: 'Unknown action' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
