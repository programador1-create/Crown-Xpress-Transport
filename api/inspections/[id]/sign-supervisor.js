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

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Sign Supervisor API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
