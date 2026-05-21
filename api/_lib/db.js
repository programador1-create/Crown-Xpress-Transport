import { neon, neonConfig } from '@neondatabase/serverless'

// Allow node connection in dev
neonConfig.fetchConnectionCache = true

let sqlInstance = null

export function getSql() {
  if (sqlInstance) return sqlInstance
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set. Configure your Neon connection in .env')
  }
  sqlInstance = neon(url)
  return sqlInstance
}

/** Quick helper for SELECT one */
export async function queryOne(strings, ...values) {
  const sql = getSql()
  const rows = await sql(strings, ...values)
  return rows[0] || null
}

/** Audit log helper */
export async function logAudit({ inspectionId = null, userId = null, userName = null, role = null, action, details = null, ip = null, ua = null }) {
  const sql = getSql()
  try {
    await sql`
      INSERT INTO audit_log (inspection_id, user_id, user_name, role, action, details, ip_address, user_agent)
      VALUES (${inspectionId}, ${userId}, ${userName}, ${role}, ${action}, ${details ? JSON.stringify(details) : null}, ${ip}, ${ua})
    `
  } catch (e) {
    console.error('audit_log error:', e.message)
  }
}

export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (fwd) return String(fwd).split(',')[0].trim()
  return req.socket?.remoteAddress || req.connection?.remoteAddress || null
}

export function readJsonBody(req) {
  // For Vercel: body already parsed if Content-Type is JSON
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body)
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)) } catch { return Promise.resolve({}) }
  }
  // For raw node streams (dev express handles parsing too)
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}
