// ============================================================
// NBCW TPR V2 API Endpoint - Preparado para sistema real
// NO CONECTADO AUN - Solo preparacion
// Cambios respecto a V1:
// - Consulta a tabla local Neon (gpsactivity) en lugar de DB externa
// - Usa yard_mapping para relacionar codigos NBCW con Crown
// - Soporte para paginacion
// - Filtros avanzados por tipo de movimiento, equipo, fecha rango
// - Ordenamiento configurable
// ============================================================

import { Client } from '@neondatabase/serverless'

const PAGE_SIZE = 50

// Conecta a la DB LOCAL de Crown (donde el script externo inserto datos de NBCW)
const DATABASE_URL = process.env.DATABASE_URL

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

  if (!DATABASE_URL) {
    return res.status(500).json({
      error: 'DATABASE_URL not configured',
      details: 'Local database not configured for TPR V2'
    })
  }

  const client = new Client(DATABASE_URL)

  try {
    await client.connect()

    const {
      type,
      date,
      yardCode,
      fromDate,
      toDate,
      equipmentType,
      search,
      page = '1',
      sortBy = 'fecha',
      sortOrder = 'desc'
    } = req.query

    const offset = (parseInt(page) - 1) * PAGE_SIZE

    // ============================================================
    // RESOLVER CODIGO DE YARDA (mapeo NBCW <-> Crown)
    // ============================================================
    let effectiveYardCode = yardCode ? yardCode.toUpperCase() : null

    if (yardCode) {
      try {
        const mapResult = await client.query(
          `SELECT nbcw_code FROM yard_mapping
           WHERE (nbcw_code = $1 OR crown_code = $1) AND is_active = true
           LIMIT 1`,
          [yardCode.toUpperCase()]
        )
        if (mapResult.rows.length > 0) {
          effectiveYardCode = mapResult.rows[0].nbcw_code
        }
      } catch (e) {
        // Si yard_mapping no existe, usar el codigo directo
        console.warn('yard_mapping table not found, using direct code')
      }
    }

    // ============================================================
    // CONSTRUIR QUERY DINAMICA
    // ============================================================

    const conditions = []
    const params = []
    let paramIdx = 1

    function addCondition(sql) {
      conditions.push(sql)
    }

    // Filtro por tipo de movimiento
    if (type === 'pending') {
      addCondition(`TRIM(status) = 'OPEN'`)
    } else if (type === 'empty') {
      addCondition(`(TRIM(el) = 'E' OR eqpcode LIKE '%Botada%')`)
    } else if (type === 'loaded') {
      addCondition(`TRIM(el) = 'L'`)
    } else if (type === 'bobtail') {
      addCondition(`(eqpcode LIKE '%Botada%' OR TRIM(tablecode) = 'BOTADA')`)
    }

    // Filtro por yarda (soporta múltiples códigos separados por coma)
    if (effectiveYardCode) {
      const yardCodes = effectiveYardCode.split(',').map(c => c.trim()).filter(Boolean)
      console.log('TPR V2 - Filtering by yard codes:', yardCodes)
      if (yardCodes.length > 0) {
        const placeholders = yardCodes.map(() => `$${paramIdx++}`).join(', ')
        params.push(...yardCodes)
        addCondition(`TRIM(fromd) IN (${placeholders})`)
        console.log('TPR V2 - Yard filter condition:', `TRIM(fromd) IN (${placeholders})`)
      }
    }

    // Filtro por fecha exacta
    if (date) {
      params.push(date)
      addCondition(`fecha = $${paramIdx++}`)
    }

    // Filtro por rango de fechas
    if (fromDate) {
      params.push(fromDate)
      addCondition(`fecha >= $${paramIdx++}`)
    }
    if (toDate) {
      params.push(toDate)
      addCondition(`fecha <= $${paramIdx++}`)
    }

    // Filtro por tipo de equipo
    if (equipmentType) {
      params.push(equipmentType.toUpperCase())
      addCondition(`TRIM(el) = $${paramIdx++}`)
    }

    // Filtro de busqueda general
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
      addCondition(`(
        LOWER(TRIM(drvcode)) LIKE $${paramIdx++}
        OR LOWER(TRIM(wono)) LIKE $${paramIdx++}
        OR LOWER(TRIM(truckid)) LIKE $${paramIdx++}
        OR LOWER(TRIM(fromcity)) LIKE $${paramIdx++}
        OR LOWER(TRIM(tocity)) LIKE $${paramIdx++}
        OR LOWER(TRIM(cstmer)) LIKE $${paramIdx++}
        OR LOWER(TRIM(eqpcode)) LIKE $${paramIdx++}
      )`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Validar ordenamiento
    const validSortColumns = ['fecha', 'timearrv', 'wono', 'drvcode', 'fromcity', 'tocity']
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'fecha'
    const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

    // ============================================================
    // QUERY PRINCIPAL CON PAGINACION
    // ============================================================

    const query = `
      SELECT
        drvcode as driver_code,
        wono as work_order,
        blno as bill_of_lading,
        fecha as date,
        fromd as from_code,
        fromcity as from_city,
        fromedo as from_state,
        tod as to_code,
        tocity as to_city,
        toedo as to_state,
        tipmov as movement_type,
        status,
        el as equipment_type,
        eqpcode as equipment_code,
        deldate as delivery_date,
        cstmer as customer,
        timearrv as arrival_time,
        timedepar as departure_time,
        oper as operator,
        truckid as truck_id,
        seal,
        instruc1 as instructions_1,
        instruc2 as instructions_2,
        amount,
        tablecode as table_code,
        trxcode as trx_code,
        synced_at
      FROM tpr
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}, timearrv DESC
      LIMIT ${PAGE_SIZE}
      OFFSET ${offset}
    `

    console.log('TPR V2 - Executing query:', query)
    console.log('TPR V2 - Query params:', params)

    const result = await client.query(query, params)
    console.log('TPR V2 - Query result count:', result.rows.length)
    const movements = result.rows

    // ============================================================
    // CONTAR TOTAL PARA PAGINACION
    // ============================================================

    const countQuery = `SELECT COUNT(*) as total FROM tpr ${whereClause}`
    const countResult = await client.query(countQuery, params)
    const totalCount = parseInt(countResult.rows[0]?.total || 0)

    await client.end()

    // ============================================================
    // RESPUESTA
    // ============================================================

    return res.status(200).json({
      success: true,
      data: movements,
      count: movements.length,
      pagination: {
        page: parseInt(page),
        pageSize: PAGE_SIZE,
        totalCount,
        totalPages: Math.ceil(totalCount / PAGE_SIZE),
        hasNextPage: offset + movements.length < totalCount,
        hasPreviousPage: parseInt(page) > 1
      },
      filters: { type, yardCode, date, fromDate, toDate, equipmentType, search }
    })

  } catch (error) {
    await client.end().catch(() => {})
    console.error('TPR V2 Query Error:', error)
    return res.status(500).json({
      error: 'Failed to query TPR V2 database',
      details: error.message
    })
  }
}
