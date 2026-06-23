import sql from 'mssql'
import http from 'http'

const config = {
  server: '192.168.5.13',
  port: 1433,
  database: 'GPSActivity',
  user: process.env.SQLSERVER_USER || 'ccentral',
  password: process.env.SQLSERVER_PASSWORD,
  options: {
    instanceName: 'BKUPEXEC',
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
}

let pool = null

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config)
    console.log('Connected to SQL Server GPSActivity')
  }
  return pool
}

const PORT = process.env.PORT || 3099

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  const url = new URL(req.url, `http://localhost:${PORT}`)

  if (url.pathname !== '/tpr') {
    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  try {
    const pool = await getPool()
    const request = pool.request()

    const type = url.searchParams.get('type')
    const yardCode = url.searchParams.get('yardCode')
    const date = url.searchParams.get('date')

    const conditions = ['1=1']

    if (type === 'pending') {
      conditions.push("RTRIM(STATUS) = 'OPEN'")
    } else if (type === 'empty') {
      conditions.push("(EQPCODE LIKE '%Botada%' OR RTRIM(TABLECODE) = 'BOTADA')")
    }

    if (yardCode) {
      const codes = yardCode.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
      if (codes.length > 0) {
        const placeholders = codes.map((c, i) => {
          request.input(`yard${i}`, sql.VarChar, c)
          return `@yard${i}`
        }).join(', ')
        conditions.push(`RTRIM(FROMD) IN (${placeholders})`)
      }
    }

    if (date) {
      request.input('fecha', sql.VarChar, date)
      conditions.push('CONVERT(varchar, FECHA, 101) = @fecha')
    }

    const where = conditions.join(' AND ')

    const result = await request.query(`
      SELECT
        RTRIM(DRVCODE)   AS driver_code,
        RTRIM(WONO)      AS work_order,
        RTRIM(BLNO)      AS bill_of_lading,
        CONVERT(varchar, FECHA, 101) AS date,
        RTRIM(FROMD)     AS from_code,
        RTRIM(FROMCITY)  AS from_city,
        RTRIM(FROMEDO)   AS from_state,
        RTRIM(TOD)       AS to_code,
        RTRIM(TOCITY)    AS to_city,
        RTRIM(TOEDO)     AS to_state,
        RTRIM(TIPMOV)    AS movement_type,
        RTRIM(STATUS)    AS status,
        RTRIM(EL)        AS equipment_type,
        RTRIM(EQPCODE)   AS equipment_code,
        CONVERT(varchar, DELDATE, 101) AS delivery_date,
        RTRIM(CSTMER)    AS customer,
        RTRIM(TIMEARRV)  AS arrival_time,
        RTRIM(TIMEDEPAR) AS departure_time,
        RTRIM(OPER)      AS operator,
        RTRIM(TRUCKID)   AS truck_id,
        RTRIM(SEAL)      AS seal,
        RTRIM(INSTRUC1)  AS instructions_1,
        RTRIM(INSTRUC2)  AS instructions_2,
        AMOUNT           AS amount,
        RTRIM(TABLECODE) AS table_code
      FROM tpr
      WHERE ${where}
      ORDER BY FECHA DESC, TIMEARRV DESC
    `)

    res.writeHead(200)
    res.end(JSON.stringify({
      success: true,
      data: result.recordset,
      count: result.recordset.length,
      last_updated: new Date().toISOString()
    }))
  } catch (err) {
    console.error('SQL Error:', err.message)
    pool = null // reset pool on error
    res.writeHead(500)
    res.end(JSON.stringify({ success: false, error: err.message }))
  }
})

server.listen(PORT, () => {
  console.log(`SQL Proxy running on http://localhost:${PORT}`)
  console.log(`Expose with: cloudflared tunnel --url http://localhost:${PORT}`)
})
