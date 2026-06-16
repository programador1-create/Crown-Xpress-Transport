import sql from './db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'POST') {
      const { username, password, language } = req.body
      const isEnglish = language === 'en'

      if (!username || !password) {
        return res.status(400).json({ 
          error: isEnglish ? 'Username and password required' : 'Usuario y contraseña requeridos' 
        })
      }

      // First check if user exists with correct password
      const users = await sql`
        SELECT id, username, full_name, role, location_id, location_name, active, profile_photo
        FROM employees
        WHERE username = ${username} AND password_hash = ${password}
      `

      if (users.length === 0) {
        return res.status(401).json({ 
          error: isEnglish ? 'Invalid username or password' : 'Usuario o contraseña incorrectos' 
        })
      }

      // Check if user is active
      const user = users[0]
      if (user.active === false) {
        return res.status(401).json({ 
          error: isEnglish ? 'User deactivated. Contact administrator.' : 'Usuario desactivado. Contacte al administrador.' 
        })
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          location_id: user.location_id,
          location_name: user.location_name,
          profile_photo: user.profile_photo,
        }
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Auth Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
