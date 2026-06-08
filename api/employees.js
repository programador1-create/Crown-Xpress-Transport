import sql from './db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // GET - List employees OR search operator by employee_number
    if (req.method === 'GET') {
      const { employee_number } = req.query
      
      // If employee_number is provided, search for operator
      if (employee_number) {
        const [operator] = await sql`
          SELECT id, employee_number, full_name, license_number, license_expiry, phone, status
          FROM operators
          WHERE employee_number = ${employee_number.toUpperCase()}
          AND status = 'active'
        `
        
        if (!operator) {
          return res.status(404).json({ error: 'Operator not found' })
        }
        
        return res.status(200).json({
          success: true,
          operator: {
            id: operator.id,
            employeeNumber: operator.employee_number,
            fullName: operator.full_name,
            licenseNumber: operator.license_number,
            licenseExpiry: operator.license_expiry,
            phone: operator.phone,
            status: operator.status
          }
        })
      }
      
      // Otherwise, list all employees
      const employees = await sql`
        SELECT id, username, full_name, role, location_id, location_name, active, created_at
        FROM employees
        ORDER BY role, full_name
      `
      return res.status(200).json({ data: employees })
    }

    // POST - Create new employee
    if (req.method === 'POST') {
      const { username, password, full_name, role, location_id, location_name } = req.body

      if (!username || !password || !full_name || !role) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Check if username exists
      const existing = await sql`SELECT id FROM employees WHERE username = ${username}`
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Username already exists' })
      }

      const [employee] = await sql`
        INSERT INTO employees (username, password, full_name, role, location_id, location_name)
        VALUES (${username}, ${password}, ${full_name}, ${role}, ${location_id || null}, ${location_name || null})
        RETURNING id, username, full_name, role, location_id, location_name, active, created_at
      `

      return res.status(201).json({ success: true, employee })
    }

    // PUT - Update employee
    if (req.method === 'PUT') {
      const { id, username, password, full_name, role, location_id, location_name, active } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Employee ID required' })
      }

      // Build update query dynamically
      let updateQuery
      if (password) {
        updateQuery = await sql`
          UPDATE employees SET
            username = ${username},
            password = ${password},
            full_name = ${full_name},
            role = ${role},
            location_id = ${location_id || null},
            location_name = ${location_name || null},
            active = ${active !== undefined ? active : true},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, username, full_name, role, location_id, location_name, active
        `
      } else {
        updateQuery = await sql`
          UPDATE employees SET
            username = ${username},
            full_name = ${full_name},
            role = ${role},
            location_id = ${location_id || null},
            location_name = ${location_name || null},
            active = ${active !== undefined ? active : true},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, username, full_name, role, location_id, location_name, active
        `
      }

      if (updateQuery.length === 0) {
        return res.status(404).json({ error: 'Employee not found' })
      }

      return res.status(200).json({ success: true, employee: updateQuery[0] })
    }

    // DELETE - Deactivate employee (soft delete)
    if (req.method === 'DELETE') {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({ error: 'Employee ID required' })
      }

      await sql`UPDATE employees SET active = false, updated_at = NOW() WHERE id = ${parseInt(id)}`

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
