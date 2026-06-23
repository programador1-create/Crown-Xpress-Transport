import { getSql } from '../_lib/db.js'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const sql = getSql()
    
    if (req.method === 'GET') {
      // List inspections
      const limit = parseInt(req.query.limit) || 50
      const offset = parseInt(req.query.offset) || 0
      const yardCode = req.query.yardCode

      let inspections
      let countResult

      if (yardCode && yardCode.trim() !== '') {
        inspections = await sql`
          SELECT
            id, uuid, trailer_number, tractor_number, container_number, seal_number, lock_number,
            driver_name, odometer, location, inspection_date,
            high_security_seal, seal_affixed,
            guard_name, guard_signed_at,
            auditor_name, auditor_signed_at,
            good_count, bad_count, pending_count,
            status, language, created_at, original_inspection_id, wono, inspection_type, trailer_type
          FROM inspections
          WHERE location = ${yardCode}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
        countResult = await sql`SELECT COUNT(*) as total FROM inspections WHERE location = ${yardCode}`
      } else {
        inspections = await sql`
          SELECT
            id, uuid, trailer_number, tractor_number, container_number, seal_number, lock_number,
            driver_name, odometer, location, inspection_date,
            high_security_seal, seal_affixed,
            guard_name, guard_signed_at,
            auditor_name, auditor_signed_at,
            good_count, bad_count, pending_count,
            status, language, created_at, original_inspection_id, wono, inspection_type, trailer_type
          FROM inspections
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
        countResult = await sql`SELECT COUNT(*) as total FROM inspections`
      }

      const total = parseInt(countResult[0]?.total || 0)

      return res.status(200).json({
        data: inspections,
        limit,
        offset,
        total
      })
    }

    if (req.method === 'POST') {
      // Create inspection
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

      // Insert inspection
      const [inspection] = await sql`
        INSERT INTO inspections (
          trailer_number, tractor_number, container_number, seal_number, lock_number,
          driver_name, odometer, location, inspection_date,
          high_security_seal, seal_affixed,
          guard_name, guard_signature, guard_signed_at,
          auditor_name, auditor_signature, auditor_signed_at,
          seal_photo, pdf_data, pdf_filename,
          language, good_count, bad_count, pending_count,
          status, inspection_type, wono, trailer_type
        ) VALUES (
          ${unitInfo?.trailerNumber || null},
          ${unitInfo?.tractorNumber || null},
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
          ${auditorSignature ? 'completed' : 'pending'},
          ${unitInfo?.inspectionType || 'LOADED'},
          ${unitInfo?.workOrder || null},
          ${unitInfo?.trailerType || null}
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
        INSERT INTO audit_log (inspection_id, action, user_name, details)
        VALUES (
          ${inspection.id},
          'created',
          ${guardSignature?.name || 'Unknown'},
          ${JSON.stringify({ counts, language })}
        )
      `

      return res.status(201).json({
        success: true,
        id: inspection.id,
        uuid: inspection.uuid,
        createdAt: inspection.created_at
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
