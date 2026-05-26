import sql, { initializeDatabase } from './db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Test database connection
    const result = await sql`SELECT NOW() as time`
    
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      time: result[0]?.time
    })
  } catch (error) {
    console.error('Health check error:', error)
    return res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    })
  }
}
