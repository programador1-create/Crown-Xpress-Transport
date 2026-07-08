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

    // Filtro por tipo de movimiento (opcional - si no se especifica, mostrar todos)
    if (effectiveType === 'pending') {
      addCondition(`TRIM(status) = 'OPEN'`)
    } else if (effectiveType === 'empty') {
      addCondition(`(TRIM(el) = 'E' OR eqpcode ILIKE '%Botada%')`)
    } else if (effectiveType === 'loaded') {
      addCondition(`TRIM(el) = 'L'`)
    } else if (effectiveType === 'bobtail') {
      addCondition(`(eqpcode ILIKE '%Botada%' OR TRIM(tablecode) = 'BOTADA')`)
    }
    // Si effectiveType no coincide con ninguno, no se aplica filtro de tipo

    // Filtro por yarda (soporta multiples codigos separados por coma)
    if (yardCode) {
      const yardCodes = yardCode.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
      if (yardCodes.length > 0) {
        const placeholders = yardCodes.map(() => `$${paramIdx++}`).join(', ')
        params.push(...yardCodes)
        addCondition(`TRIM(fromd) IN (${placeholders})`)
      }
    }

    // Filtro por fecha exacta
    if (date) {
      params.push(date)
      addCondition(`fecha = $${paramIdx++}`)
    }

    // Sincronizar registros de los ultimos 2 dias para mostrar pendientes
    // Formato de fecha es MM/DD/YYYY (ej: 6/26/2026)
    addCondition(`TO_DATE(fecha, 'MM/DD/YYYY') >= CURRENT_DATE - INTERVAL '2 days'`)

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const query = `
      SELECT
        drvcode AS driver_code,
        wono AS work_order,
        blno AS bill_of_lading,
        fecha AS fecha_raw,
        fecha AS date,
        fromd AS from_code,
        fromcity AS from_city,
        fromedo AS from_state,
        tod AS to_code,
        tocity AS to_city,
        toedo AS to_state,
        tipmov AS movement_type,
        status,
        el AS equipment_type,
        eqpcode AS equipment_code,
        deldate AS deldate_raw,
        deldate AS delivery_date,
        cstmer AS customer,
        timearrv AS arrival_time,
        timedepar AS departure_time,
        oper AS operator,
        truckid AS truck_id,
        seal,
        instruc1 AS instructions_1,
        instruc2 AS instructions_2,
        amount,
        tablecode AS table_code,
        trxcode AS trx_code,
        synced_at
      FROM tpr
      ${whereClause}
      ORDER BY TO_DATE(fecha, 'MM/DD/YYYY') DESC, timearrv DESC
    `

    const allMovements = await sql.query(query, params)

    // Debug: log sample fecha values
    if (allMovements.length > 0) {
      console.log('Sample fecha values:', allMovements.slice(0, 3).map(m => m.fecha))
    }

    // ============================================================
    // 2. Cross-filter: marcar los ya inspeccionados
    // ============================================================
    // El cruce se hace por WORK ORDER (wono), que identifica de forma única
    // cada movimiento. Así una misma caja/tractor puede inspeccionarse varias
    // veces al día para movimientos distintos (cada uno con su propio wono).
    const inspectedWonos = new Set()
    try {
      const inspected = await sql`
        SELECT DISTINCT UPPER(TRIM(wono)) AS wono
        FROM inspections
        WHERE status NOT IN ('superseded')
          AND wono IS NOT NULL
          AND TRIM(wono) <> ''
          AND created_at >= NOW() - INTERVAL '7 days'
      `
      for (const row of inspected) {
        if (row.wono) inspectedWonos.add(row.wono)
      }
    } catch (localErr) {
      console.warn('Cross-filter query failed (non-fatal):', localErr.message)
    }

    // Mark each movement with already_inspected flag (matched by work order)
    const movements = allMovements.map(m => {
      const wono = m.work_order?.toString().trim().toUpperCase()
      const already = !!(wono && inspectedWonos.has(wono))
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
