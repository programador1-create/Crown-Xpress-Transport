import sql from '../db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query

  try {
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

      // Build update query
      const updates = []
      if (username !== undefined) updates.push(sql`username = ${username}`)
      if (password) updates.push(sql`password_hash = ${password}`)
      if (full_name !== undefined) updates.push(sql`full_name = ${full_name}`)
      if (role !== undefined) updates.push(sql`role = ${role}`)
      if (location_id !== undefined) updates.push(sql`location_id = ${location_id}`)
      if (location_name !== undefined) updates.push(sql`location_name = ${location_name}`)
      if (active !== undefined) updates.push(sql`active = ${active}`)

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

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
