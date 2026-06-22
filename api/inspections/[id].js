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

    if (req.method === 'POST' && req.url.includes('sign-supervisor')) {
      const { name, signedAt } = req.body

      if (!name || !signedAt) {
        return res.status(400).json({ error: 'Name and signedAt are required' })
      }

      // Update inspection with supervisor signature and mark as supervised
      const result = await sql`
        UPDATE inspections
        SET supervisor_signature = ${name},
            supervisor_signed_at = ${signedAt},
            status = 'supervised',
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

    if (req.method === 'POST' && req.url.includes('reconfirm')) {
      const { reason, modifications, reconfirmed_by, reconfirmed_by_name } = req.body

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({ error: 'Reason (>=10 chars) is required' })
      }
      if (!modifications || modifications.length === 0) {
        return res.status(400).json({ error: 'At least one modification required' })
      }

      // Get original inspection
      const [original] = await sql`SELECT * FROM inspections WHERE id = ${parseInt(id)} LIMIT 1`
      if (!original) {
        return res.status(404).json({ error: 'Original inspection not found' })
      }

      // Get original points
      const originalPoints = await sql`
        SELECT * FROM inspection_points WHERE inspection_id = ${parseInt(id)}
      `

      // Merge points with modifications
      const pointsMap = {}
      originalPoints.forEach(p => {
        pointsMap[p.point_id] = {
          point_id: p.point_id,
          status: p.status,
          issue_id: p.issue_id,
          issue_text: p.issue_text,
          photo: p.photo
        }
      })

      modifications.forEach(mod => {
        if (pointsMap[mod.pointId]) {
          pointsMap[mod.pointId].status = mod.status
          pointsMap[mod.pointId].issue_id = mod.issueId
          pointsMap[mod.pointId].issue_text = mod.issueText
          pointsMap[mod.pointId].photo = mod.photo
        }
      })

      const allPoints = Object.values(pointsMap)
      const total_good = allPoints.filter(p => p.status === 'good').length
      const total_bad = allPoints.filter(p => p.status === 'bad').length
      const total_pending = 20 - total_good - total_bad

      // Insert new inspection (reconfirmation)
      const [newInsp] = await sql`
        INSERT INTO inspections (
          trailer_number, seal_number, lock_number, driver_name, location,
          inspection_date, language,
          operator_name, guard_name, guard_signed_at,
          status, total_good, total_bad, total_pending,
          original_inspection_id, reconfirmation_reason, is_reconfirmation,
          created_ip, created_user_agent
        ) VALUES (
          ${original.trailer_number}, ${original.seal_number}, ${original.lock_number},
          ${original.driver_name}, ${original.location},
          NOW(), ${original.language},
          ${reconfirmed_by_name || original.operator_name},
          ${reconfirmed_by_name || original.guard_name},
          NOW(),
          'reconfirmed', ${total_good}, ${total_bad}, ${total_pending},
          ${parseInt(id)}, ${reason}, TRUE,
          ${req.headers['x-forwarded-for'] || req.socket.remoteAddress},
          ${req.headers['user-agent'] || null}
        )
        RETURNING id, inspection_uuid, created_at
      `

      // Insert merged points
      for (const pt of allPoints) {
        await sql`
          INSERT INTO inspection_points (inspection_id, point_id, status, issue_id, issue_text, photo)
          VALUES (${newInsp.id}, ${pt.point_id}, ${pt.status}, ${pt.issue_id}, ${pt.issue_text}, ${pt.photo})
          ON CONFLICT (inspection_id, point_id) DO NOTHING
        `
      }

      // Update original status
      await sql`UPDATE inspections SET status = 'superseded', updated_at = NOW() WHERE id = ${parseInt(id)}`

      return res.status(201).json({
        success: true,
        id: newInsp.id,
        uuid: newInsp.inspection_uuid,
        original_id: parseInt(id),
        modifications: modifications.length
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
