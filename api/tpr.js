import { getSql } from './_lib/db.js'

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

  const sql = getSql()

  try {
    const { type, date, yardCode } = req.query
    const effectiveType = type || 'pending'

    // ============================================================
    // 1. Consultar movimientos desde la tabla tpr en Neon
    // ============================================================
    const conditions = []
    const params = []
    let paramIdx = 1

    function addCondition(sqlFragment) {
      conditions.push(sqlFragment)
    }

    // Filtro por tipo de movimiento
    if (effectiveType === 'pending') {
      addCondition(`TRIM(status) = 'OPEN'`)
    } else if (effectiveType === 'empty') {
      addCondition(`(TRIM(equipment_type) = 'E' OR equipment_code ILIKE '%Botada%')`)
    } else if (effectiveType === 'loaded') {
      addCondition(`TRIM(equipment_type) = 'L'`)
    } else if (effectiveType === 'bobtail') {
      addCondition(`(equipment_code ILIKE '%Botada%' OR TRIM(table_code) = 'BOTADA')`)
    }

    // Filtro por yarda (soporta multiples codigos separados por coma)
    if (yardCode) {
      const yardCodes = yardCode.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
      if (yardCodes.length > 0) {
        const placeholders = yardCodes.map(() => `$${paramIdx++}`).join(', ')
        params.push(...yardCodes)
        addCondition(`TRIM(from_code) IN (${placeholders})`)
      }
    }

    // Filtro por fecha exacta
    if (date) {
      params.push(date)
      addCondition(`date = $${paramIdx++}`)
    }

    // Solo sincronizar registros recientes (ultimos 30 dias)
    addCondition(`date >= CURRENT_DATE - INTERVAL '30 days'`)

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const query = `
      SELECT
        driver_code,
        work_order,
        bill_of_lading,
        fecha_raw,
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        from_code,
        from_city,
        from_state,
        to_code,
        to_city,
        to_state,
        movement_type,
        status,
        equipment_type,
        equipment_code,
        deldate_raw,
        TO_CHAR(delivery_date, 'YYYY-MM-DD') AS delivery_date,
        customer,
        arrival_time,
        departure_time,
        operator,
        truck_id,
        seal,
        instructions_1,
        instructions_2,
        amount,
        table_code,
        trx_code,
        synced_at
      FROM tpr
      ${whereClause}
      ORDER BY date DESC, arrival_time DESC
    `

    const allMovements = await sql(query, params)

    // ============================================================
    // 2. Cross-filter: marcar los ya inspeccionados
    // ============================================================
    let inspectedSet = new Set()
    try {
      const inspected = await sql`
        SELECT DISTINCT
          UPPER(TRIM(trailer_number))  AS trailer_number,
          UPPER(TRIM(seal_number))     AS seal_number,
          UPPER(TRIM(lock_number))     AS lock_number,
          UPPER(TRIM(tractor_number))  AS tractor_number
        FROM inspections
        WHERE status NOT IN ('superseded')
          AND created_at >= NOW() - INTERVAL '30 days'
      `
      for (const row of inspected) {
        if (row.trailer_number)  inspectedSet.add(row.trailer_number)
        if (row.seal_number)     inspectedSet.add(row.seal_number)
        if (row.lock_number)     inspectedSet.add(row.lock_number)
        if (row.tractor_number)  inspectedSet.add(row.tractor_number)
      }
    } catch (localErr) {
      console.warn('Cross-filter query failed (non-fatal):', localErr.message)
    }

    // Mark each movement with already_inspected flag
    const movements = allMovements.map(m => {
      const blno  = m.bill_of_lading?.toString().trim().toUpperCase()
      const seal  = m.seal?.toString().trim().toUpperCase()
      const truck = m.truck_id?.toString().trim().toUpperCase()
      const already = !!(blno && inspectedSet.has(blno)) ||
                      !!(seal && inspectedSet.has(seal)) ||
                      !!(truck && inspectedSet.has(truck))
      return { ...m, already_inspected: already }
    })

    const pendingCount = movements.filter(m => !m.already_inspected).length

    return res.status(200).json({
      success: true,
      data: movements,
      count: movements.length,
      pending_count: pendingCount,
      last_updated: new Date().toISOString()
    })

  } catch (error) {
    console.error('TPR Query Error:', error)
    return res.status(500).json({
      error: 'Failed to query TPR data',
      details: error.message
    })
  }
}
