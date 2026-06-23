import { getSql } from './_lib/db.js'
import { getSqlServerPool } from './_lib/sqlserver.js'
import sql from 'mssql'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { type, date, yardCode } = req.query

    // Verify SQL Server credentials are configured
    if (!process.env.SQLSERVER_HOST || !process.env.SQLSERVER_USER || !process.env.SQLSERVER_PASSWORD) {
      return res.status(500).json({
        error: 'SQL Server credentials not configured',
        details: 'Set SQLSERVER_HOST, SQLSERVER_USER, SQLSERVER_PASSWORD in Vercel environment variables'
      })
    }

    // Connect to SQL Server GPSActivity
    const pool = await getSqlServerPool()
    const request = pool.request()

    // Build WHERE conditions
    const conditions = ['1=1']

    if (type === 'pending') {
      conditions.push("RTRIM(STATUS) = 'OPEN'")
    } else if (type === 'empty') {
      conditions.push("(EQPCODE LIKE '%Botada%' OR RTRIM(TABLECODE) = 'BOTADA')")
    }

    if (yardCode) {
      const yardCodes = yardCode.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
      if (yardCodes.length > 0) {
        const placeholders = yardCodes.map((c, i) => {
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

    const whereClause = conditions.join(' AND ')

    const query = `
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
      WHERE ${whereClause}
      ORDER BY FECHA DESC, TIMEARRV DESC
    `

    const result = await request.query(query)
    const allMovements = result.recordset

    // Cross-filter: get already-inspected numbers from local Neon PostgreSQL
    let inspectedSet = new Set()
    try {
      const localSql = getSql()
      const inspected = await localSql`
        SELECT DISTINCT
          UPPER(TRIM(trailer_number)) AS trailer_number,
          UPPER(TRIM(seal_number))    AS seal_number,
          UPPER(TRIM(lock_number))    AS lock_number
        FROM inspections
        WHERE status NOT IN ('superseded')
          AND created_at >= NOW() - INTERVAL '30 days'
      `
      for (const row of inspected) {
        if (row.trailer_number) inspectedSet.add(row.trailer_number)
        if (row.seal_number)    inspectedSet.add(row.seal_number)
        if (row.lock_number)    inspectedSet.add(row.lock_number)
      }
    } catch (localErr) {
      console.warn('Cross-filter query failed (non-fatal):', localErr.message)
    }

    // Mark each movement with already_inspected flag
    const movements = allMovements.map(m => {
      const blno  = m.bill_of_lading?.toString().trim().toUpperCase()
      const seal  = m.seal?.toString().trim().toUpperCase()
      const truck = m.truck_id?.toString().trim().toUpperCase()
      const already = !!(blno  && inspectedSet.has(blno))  ||
                      !!(seal  && inspectedSet.has(seal))   ||
                      !!(truck && inspectedSet.has(truck))
      return { ...m, already_inspected: already }
    })

    const pendingCount = movements.filter(m => !m.already_inspected).length

    return res.status(200).json({
      success: true,
      data: movements,
      count: movements.length,
      pending_count: pendingCount,
      last_updated: new Date().toISOString(),
      _source: `SQL Server ${process.env.SQLSERVER_HOST}\\${process.env.SQLSERVER_INSTANCE || 'BKUPEXEC'}`
    })

  } catch (error) {
    console.error('TPR Query Error:', error)
    return res.status(500).json({
      error: 'Failed to query SQL Server GPSActivity.tpr',
      details: error.message
    })
  }
}
