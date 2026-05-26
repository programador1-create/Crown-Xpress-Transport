import sql from '../../db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query

  try {
    if (req.method === 'POST') {
      const { name, signature, signedAt } = req.body
      const isUuid = id.includes('-')

      const result = isUuid
        ? await sql`
            UPDATE inspections 
            SET 
              auditor_name = ${name},
              auditor_signature = ${signature || null},
              auditor_signed_at = ${signedAt ? new Date(signedAt) : new Date()},
              status = 'completed',
              updated_at = NOW()
            WHERE uuid = ${id}
            RETURNING id, uuid, auditor_name, auditor_signed_at, status
          `
        : await sql`
            UPDATE inspections 
            SET 
              auditor_name = ${name},
              auditor_signature = ${signature || null},
              auditor_signed_at = ${signedAt ? new Date(signedAt) : new Date()},
              status = 'completed',
              updated_at = NOW()
            WHERE id = ${parseInt(id)}
            RETURNING id, uuid, auditor_name, auditor_signed_at, status
          `

      if (result.length === 0) {
        return res.status(404).json({ error: 'Inspection not found' })
      }

      // Create audit log
      await sql`
        INSERT INTO audit_logs (inspection_id, action, actor_name, details)
        VALUES (
          ${result[0].id},
          'auditor_signed',
          ${name},
          ${JSON.stringify({ signedAt })}
        )
      `

      return res.status(200).json({
        success: true,
        id: result[0].id,
        uuid: result[0].uuid,
        auditor_name: result[0].auditor_name,
        auditor_signed_at: result[0].auditor_signed_at,
        status: result[0].status
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
