import sql from '../db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      // List all employees
      const { search, role, location_id, active } = req.query
      
      let query = sql`
        SELECT id, username, full_name, role, location_id, location_name, active, created_at, updated_at
        FROM employees
        WHERE 1=1
      `
      
      // Build dynamic query based on filters
      const employees = await sql`
        SELECT id, username, full_name, role, location_id, location_name, active, created_at, updated_at
        FROM employees
        WHERE 
          (${search || ''} = '' OR full_name ILIKE ${'%' + (search || '') + '%'} OR username ILIKE ${'%' + (search || '') + '%'})
          AND (${role || ''} = '' OR role = ${role || ''})
          AND (${location_id || ''} = '' OR location_id = ${parseInt(location_id) || 0})
          AND (${active === undefined ? '' : active} = '' OR active = ${active === 'true'})
        ORDER BY full_name ASC
      `

      return res.status(200).json({ data: employees })
    }

    if (req.method === 'POST') {
      // Create new employee
      const { username, password, full_name, role, location_id, location_name } = req.body

      if (!username || !password || !full_name || !role) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Check if username already exists
      const existing = await sql`SELECT id FROM employees WHERE username = ${username}`
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Username already exists' })
      }

      const [employee] = await sql`
        INSERT INTO employees (username, password_hash, full_name, role, location_id, location_name, active)
        VALUES (${username}, ${password}, ${full_name}, ${role}, ${location_id || null}, ${location_name || null}, true)
        RETURNING id, username, full_name, role, location_id, location_name, active, created_at
      `

      return res.status(201).json({ success: true, employee })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
