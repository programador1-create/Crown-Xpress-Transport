
import { Pool } from 'pg'

let pool = null

function getPool() {
  if (pool) return pool
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set. Configure your PostgreSQL connection in .env')
  }
  pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  })
  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err.message)
  })
  return pool
}

/**
 * Tagged template literal SQL function (compatible with @neondatabase/serverless interface).
 * Usage: const rows = await sql`SELECT * FROM users WHERE id = ${userId}`
 */
function sql(strings, ...values) {
  let text = ''
  for (let i = 0; i < strings.length; i++) {
    text += strings[i]
    if (i < values.length) {
      text += `$${i + 1}`
    }
  }
  return getPool().query(text, values).then(res => res.rows)
}

export function getSql() {
  return sql
}

/** Quick helper for SELECT one — must be called as tagged template: queryOne`SELECT...` */
export async function queryOne(strings, ...values) {
  if (!Array.isArray(strings)) {
    throw new Error('queryOne must be called as a tagged template: queryOne`SELECT...`')
  }
  const rows = await sql(strings, ...values)
  return rows[0] || null
}

/** Audit log helper */
export async function logAudit({ inspectionId = null, userId = null, userName = null, role = null, action, details = null, ip = null, ua = null }) {
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
