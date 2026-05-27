import sql from '../db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    // Find user in database
    const employees = await sql`
      SELECT id, username, full_name, role, location_id, location_name, active
      FROM employees
      WHERE username = ${username} AND password_hash = ${password} AND active = true
    `

    if (employees.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const user = employees[0]

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        location_id: user.location_id,
        location_name: user.location_name,
      }
    })
  } catch (error) {
    console.error('Login Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
