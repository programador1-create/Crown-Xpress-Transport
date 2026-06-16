import sql from './db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const { username } = req.query

      if (!username) {
        return res.status(400).json({ error: 'Username required' })
      }

      const [user] = await sql`
        SELECT id, username, full_name, role, active, password_hash
        FROM employees
        WHERE username = ${username}
      `

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

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

    } catch (error) {
      console.error('Check User Status Error:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
