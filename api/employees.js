import sql from './db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query

  try {
    // Handle single employee operations (PUT, DELETE, GET by ID)
    if (id && (req.method === 'GET' || req.method === 'PUT' || req.method === 'DELETE')) {
      if (req.method === 'GET') {
        // Get single employee
        const employees = await sql`
          SELECT id, username, full_name, role, location_id, location_name, active, created_at, updated_at
          FROM employees WHERE id = ${parseInt(id)}
        `

        if (employees.length === 0) {
          return res.status(404).json({ error: 'Employee not found' })
        }

        return res.status(200).json({ employee: employees[0] })
      }

      if (req.method === 'PUT') {
        // Update employee
        const { username, password, full_name, role, location_id, location_name, active } = req.body

        // Check if username already exists for another user
        if (username) {
          const existing = await sql`SELECT id FROM employees WHERE username = ${username} AND id != ${parseInt(id)}`
          if (existing.length > 0) {
            return res.status(400).json({ error: 'Username already exists' })
          }
        }

        const [employee] = await sql`
          UPDATE employees SET
            username = COALESCE(${username || null}, username),
            password_hash = COALESCE(${password || null}, password_hash),
            full_name = COALESCE(${full_name || null}, full_name),
            role = COALESCE(${role || null}, role),
            location_id = COALESCE(${location_id !== undefined ? location_id : null}, location_id),
            location_name = COALESCE(${location_name || null}, location_name),
            active = COALESCE(${active !== undefined ? active : null}, active),
            updated_at = NOW()
          WHERE id = ${parseInt(id)}
          RETURNING id, username, full_name, role, location_id, location_name, active, updated_at
        `

        if (!employee) {
          return res.status(404).json({ error: 'Employee not found' })
        }

        return res.status(200).json({ success: true, employee })
      }

      if (req.method === 'DELETE') {
        // Soft delete - just deactivate
        const [employee] = await sql`
          UPDATE employees SET active = false, updated_at = NOW()
          WHERE id = ${parseInt(id)}
          RETURNING id
        `

        if (!employee) {
          return res.status(404).json({ error: 'Employee not found' })
        }

        return res.status(200).json({ success: true, message: 'Employee deactivated' })
      }
    }

    // Handle list and create operations (no ID)
    if (!id && (req.method === 'GET' || req.method === 'POST')) {
      if (req.method === 'GET') {
        // List all employees
        const { search, role, location_id, active } = req.query
        
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
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
