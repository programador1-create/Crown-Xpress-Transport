import { getSql } from './_lib/db.js'

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
      const sql = getSql()
      const users = await sql`
        SELECT e.id, e.username, e.full_name, e.role, e.location_id, e.location_name, e.active, e.profile_photo
        FROM employees e
        WHERE e.username = ${username} AND e.password_hash = ${password}
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

      // Get yard assignments for this user
      const yardAssignments = await sql`
        SELECT ya.id as assignment_id, ya.yard_id, y.name as yard_name, y.code as yard_code, y.type as yard_type
        FROM yard_assignments ya
        JOIN yards y ON ya.yard_id = y.id
        WHERE ya.employee_id = ${user.id} AND ya.is_active = true
      `

      // Build location_code from yard assignments
      const locationCode = yardAssignments.length > 0 ? yardAssignments.map(y => y.yard_code).join(',') : null

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          location_id: user.location_id,
          location_name: user.location_name,
          location_code: locationCode,
          yard_assignments: yardAssignments,
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
