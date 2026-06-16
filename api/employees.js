import sql from './db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // GET - List employees OR search operator by employee_number OR search by name OR list all operators
    if (req.method === 'GET') {
      const { employee_number, search_name, list_operators } = req.query
      
      // If list_operators is true, return all active operators
      if (list_operators === 'true') {
        const operators = await sql`
          SELECT id, employee_number, full_name, license_number, license_expiry, phone, status
          FROM operators
          WHERE status = 'active'
          ORDER BY full_name ASC
        `
        
        return res.status(200).json({
          success: true,
          operators: operators.map(op => ({
            id: op.id,
            employeeNumber: op.employee_number,
            fullName: op.full_name,
            licenseNumber: op.license_number,
            licenseExpiry: op.license_expiry,
            phone: op.phone,
            status: op.status
          }))
        })
      }
      
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
      
      // If search_name is provided, search operators by name
      if (search_name) {
        const searchTerm = `%${search_name.toUpperCase()}%`
        const operators = await sql`
          SELECT id, employee_number, full_name, license_number, license_expiry, phone, status
          FROM operators
          WHERE UPPER(full_name) LIKE ${searchTerm}
          AND status = 'active'
          ORDER BY full_name ASC
          LIMIT 10
        `
        
        return res.status(200).json({
          success: true,
          operators: operators.map(op => ({
            id: op.id,
            employeeNumber: op.employee_number,
            fullName: op.full_name,
            licenseNumber: op.license_number,
            licenseExpiry: op.license_expiry,
            phone: op.phone,
            status: op.status
          }))
        })
      }
      
      // Otherwise, list all employees
      const employees = await sql`
        SELECT id, username, password_hash, full_name, role, location_id, location_name, active, created_at, profile_photo
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
        INSERT INTO employees (username, password_hash, full_name, role, location_id, location_name, profile_photo)
        VALUES (${username}, ${password}, ${full_name}, ${role}, ${location_id || null}, ${location_name || null}, ${profile_photo || null})
        RETURNING id, username, full_name, role, location_id, location_name, active, created_at, profile_photo
      `

      return res.status(201).json({ success: true, employee })
    }

    // PUT - Update employee
    if (req.method === 'PUT') {
      const { id, username, password, full_name, role, location_id, location_name, active, profile_photo } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Employee ID required' })
      }

      // Build update query dynamically
      let updateQuery
      if (password) {
        updateQuery = await sql`
          UPDATE employees SET
            username = ${username},
            password_hash = ${password},
            full_name = ${full_name},
            role = ${role},
            location_id = ${location_id || null},
            location_name = ${location_name || null},
            active = ${active !== undefined ? active : true},
            profile_photo = ${profile_photo || null},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, username, full_name, role, location_id, location_name, active, profile_photo
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
            profile_photo = ${profile_photo || null},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, username, full_name, role, location_id, location_name, active, profile_photo
        `
      }

      if (updateQuery.length === 0) {
        return res.status(404).json({ error: 'Employee not found' })
      }

      return res.status(200).json({ success: true, employee: updateQuery[0] })
    }

    // DELETE - Deactivate or permanently delete employee
    if (req.method === 'DELETE') {
      const { id, permanent } = req.query

      if (!id) {
        return res.status(400).json({ error: 'Employee ID required' })
      }

      if (permanent === 'true') {
        // Permanent delete - only allowed for inactive users
        const [employee] = await sql`SELECT active FROM employees WHERE id = ${parseInt(id)}`
        if (!employee) {
          return res.status(404).json({ error: 'Employee not found' })
        }
        if (employee.active === true) {
          return res.status(400).json({ error: 'Cannot permanently delete active user. Deactivate first.' })
        }
        await sql`DELETE FROM employees WHERE id = ${parseInt(id)}`
        return res.status(200).json({ success: true, message: 'Employee permanently deleted' })
      } else {
        // Soft delete - just deactivate
        await sql`UPDATE employees SET active = false, updated_at = NOW() WHERE id = ${parseInt(id)}`
        return res.status(200).json({ success: true })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
