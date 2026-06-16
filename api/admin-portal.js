import sql from './db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200). end()
  }

  try {
    const { method, query } = req
    const { action } = query

    // USER STATUS CHECK
    if (action === 'check-user') {
      if (method === 'GET') {
        const { username } = query
        if (!username) return res.status(400).json({ error: 'Username required' })

        const [user] = await sql`
          SELECT id, username, full_name, role, active, password_hash
          FROM employees WHERE username = ${username}
        `
        
        if (!user) return res.status(404).json({ error: 'User not found' })
        
        return res.status(200).json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
            active: user.active,
            has_password: !!user.password_hash
          }
        })
      }
    }

    // SYSTEM STATUS
    if (action === 'system-status') {
      if (method === 'GET') {
        const [users] = await sql`SELECT COUNT(*) as total FROM employees`
        const [yards] = await sql`SELECT COUNT(*) as total FROM yards WHERE is_active = true`
        const [assignments] = await sql`SELECT COUNT(*) as total FROM yard_assignments WHERE is_active = true`
        
        return res.status(200).json({
          success: true,
          status: {
            users: users.total,
            yards: yards.total,
            assignments: assignments.total
          }
        })
      }
    }

    // BULK OPERATIONS
    if (action === 'bulk') {
      if (method === 'POST') {
        const { operation, data } = req.body
        
        if (operation === 'deactivate-users') {
          const { userIds } = data
          await sql`UPDATE employees SET active = false WHERE id = ANY(${userIds})`
          return res.status(200).json({ success: true, message: 'Users deactivated' })
        }
        
        if (operation === 'assign-yards') {
          const { assignments } = data
          for (const { employee_id, yard_id } of assignments) {
            await sql`
              INSERT INTO yard_assignments (employee_id, yard_id)
              VALUES (${employee_id}, ${yard_id})
              ON CONFLICT (employee_id, yard_id) DO UPDATE SET is_active = true
            `
          }
          return res.status(200).json({ success: true, message: 'Yards assigned' })
        }
      }
    }

    return res.status(404).json({ error: 'Action not found' })

  } catch (error) {
    console.error('Admin Portal API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
