import sql from '../../db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query

  try {
    if (req.method === 'GET') {
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
