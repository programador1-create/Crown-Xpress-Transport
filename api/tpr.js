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
    // Usamos zona horaria de Tijuana (America/Tijuana) para consistencia
    addCondition(`TO_DATE(fecha, 'MM/DD/YYYY') >= (NOW() AT TIME ZONE 'America/Tijuana')::date - INTERVAL '2 days'`)

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const query = `
      SELECT
        id,
        sql_id,
        drvcode AS driver_code,
        wono AS work_order,
        blno AS bill_of_lading,
        fecha AS fecha,
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
    // Una sola query obtiene todas las inspecciones de los últimos 7 días.
    // Se procesa todo en JavaScript para minimizar compute time en Neon.
    const inspectedKeys = new Set()
    const inspectedByTprId = new Set()
    const inspectedByWonoWithDate = new Set()
    const fallbackTractors = new Set()
    let inspected = []
    try {
      inspected = await sql`
        SELECT DISTINCT
          UPPER(TRIM(wono)) AS wono,
          UPPER(TRIM(tractor_number)) AS truck_id,
          UPPER(TRIM(location)) AS location,
          inspection_date
        FROM inspections
        WHERE status NOT IN ('superseded')
          AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Tijuana')::date >= (NOW() AT TIME ZONE 'America/Tijuana')::date - INTERVAL '7 days'
      `
      for (const row of inspected) {
        const d = row.inspection_date ? new Date(row.inspection_date) : null
        const fecha = d && !isNaN(d.getTime())
          ? d.toLocaleDateString('en-US', { timeZone: 'America/Tijuana' })
          : ''

        if (row.wono && row.wono.trim() !== '') {
          const wonoParts = row.wono.split('::')
          const workOrder = wonoParts[0] || row.wono
          const tprId = wonoParts[1] || ''
          inspectedKeys.add(`${workOrder}::${row.truck_id || ''}::${row.location || ''}::${fecha}::${tprId}`)
          if (tprId) {
            inspectedByTprId.add(`${workOrder}::${tprId.toLowerCase()}`)
          }
          inspectedByWonoWithDate.add(`${workOrder}::${fecha}`)
        }

        // Fallback: inspecciones sin wono pero con tractor_number
        if ((!row.wono || row.wono.trim() === '') && row.truck_id) {
          fallbackTractors.add(row.truck_id)
        }
      }
      console.log('TPR inspectedKeys count:', inspectedKeys.size, 'inspectedByTprId count:', inspectedByTprId.size, 'inspectedByWonoWithDate count:', inspectedByWonoWithDate.size, 'fallbackTractors count:', fallbackTractors.size)
    } catch (localErr) {
      console.warn('Cross-filter query failed (non-fatal):', localErr.message)
    }

    // Mark each movement with already_inspected flag (matched by composite key or sql_id)
    const movements = allMovements.map(m => {
      const wono = m.work_order?.toString().trim().toUpperCase()
      const truck = m.truck_id?.toString().trim().toUpperCase()
      const fromd = m.from_code?.toString().trim().toUpperCase()
      // Convertir fecha de YYYY-MM-DD a MM/DD/YYYY
      let fecha = ''
      if (m.fecha) {
        const fechaStr = m.fecha?.toString().trim()
        if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Formato YYYY-MM-DD
          const [year, month, day] = fechaStr.split('-')
          fecha = `${month}/${day}/${year}`
        } else {
          fecha = fechaStr
        }
      }
      const sqlId = m.sql_id?.toString().trim() || ''
      const compositeKey = `${wono || ''}::${truck || ''}::${fromd || ''}::${fecha}::${sqlId}`
      const sqlIdKey = sqlId && wono ? `${wono}::${sqlId.toLowerCase()}` : null
      const wonoWithDateKey = wono && fecha ? `${wono}::${fecha}` : null
      const alreadyByWono = !!(wono && inspectedKeys.has(compositeKey))
      const alreadyBySqlId = !!(sqlIdKey && inspectedByTprId.has(sqlIdKey))
      const alreadyByWonoOnly = !!(wonoWithDateKey && inspectedByWonoWithDate.has(wonoWithDateKey))
      const alreadyByTractor = !!(truck && fallbackTractors.has(truck))
      // No marcar como inspeccionado si el fallback por wono+fecha coincide pero ya hay sql_id match
      // (el sql_id match es más preciso y ya se evaluó arriba)
      const already = alreadyByWono || alreadyBySqlId || alreadyByWonoOnly || alreadyByTractor

      return { ...m, already_inspected: already }
    })

    const pendingCount = movements.filter(m => !m.already_inspected).length

    // Debug: devolver keys de cruce si se solicita con ?debug=1
    const debug = req.query?.debug === '1' || req.query?.debug === 'true'
    const debugInfo = debug ? {
      inspectedKeysSample: Array.from(inspectedKeys).slice(0, 50),
      inspectedByTprIdSample: Array.from(inspectedByTprId).slice(0, 50),
      movementKeys: movements.slice(0, 20).map(m => ({
        id: m.id,
        sql_id: m.sql_id,
        work_order: m.work_order,
        truck_id: m.truck_id,
        fecha: m.fecha,
        already_inspected: m.already_inspected,
        compositeKey: `${m.work_order?.toString().trim().toUpperCase()}::${m.truck_id?.toString().trim().toUpperCase()}::${m.from_code?.toString().trim().toUpperCase()}::${m.fecha?.toString().trim()}::${m.sql_id?.toString().trim()}`,
        sqlIdKey: m.sql_id && m.work_order ? `${m.work_order?.toString().trim().toUpperCase()}::${m.sql_id?.toString().trim()}` : null
      })),
      rawInspectionsSample: inspected.slice(0, 20).map(r => ({
        wono: r.wono,
        truck_id: r.truck_id,
        location: r.location,
        inspection_date: r.inspection_date
      }))
    } : undefined

    return res.status(200).json({
      success: true,
      data: movements,
      count: movements.length,
      pending_count: pendingCount,
      last_updated: new Date().toISOString(),
      ...(debugInfo ? { _debug: debugInfo } : {})
    })

  } catch (error) {
    console.error('TPR Query Error:', error)
    return res.status(500).json({
      error: 'Failed to query TPR data',
      details: error.message
    })
  }
}
