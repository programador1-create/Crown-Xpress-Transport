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
      addCondition(`(TRIM(equipment_type) = 'E' OR equipment_code LIKE '%Botada%')`)
    } else if (type === 'loaded') {
      addCondition(`TRIM(equipment_type) = 'L'`)
    } else if (type === 'bobtail') {
      addCondition(`(equipment_code LIKE '%Botada%' OR TRIM(table_code) = 'BOTADA')`)
    }

    // Filtro por yarda (soporta múltiples códigos separados por coma)
    if (effectiveYardCode) {
      const yardCodes = effectiveYardCode.split(',').map(c => c.trim()).filter(Boolean)
      console.log('TPR V2 - Filtering by yard codes:', yardCodes)
      if (yardCodes.length > 0) {
        const placeholders = yardCodes.map(() => `$${paramIdx++}`).join(', ')
        params.push(...yardCodes)
        addCondition(`TRIM(from_code) IN (${placeholders})`)
        console.log('TPR V2 - Yard filter condition:', `TRIM(from_code) IN (${placeholders})`)
      }
    }

    // Filtro por fecha exacta
    if (date) {
      params.push(date)
      addCondition(`date = $${paramIdx++}`)
    }

    // Filtro por rango de fechas
    if (fromDate) {
      params.push(fromDate)
      addCondition(`date >= $${paramIdx++}`)
    }
    if (toDate) {
      params.push(toDate)
      addCondition(`date <= $${paramIdx++}`)
    }

    // Filtro por tipo de equipo
    if (equipmentType) {
      params.push(equipmentType.toUpperCase())
      addCondition(`TRIM(equipment_type) = $${paramIdx++}`)
    }

    // Filtro de busqueda general
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
      addCondition(`(
        LOWER(TRIM(driver_code)) LIKE $${paramIdx++}
        OR LOWER(TRIM(work_order)) LIKE $${paramIdx++}
        OR LOWER(TRIM(truck_id)) LIKE $${paramIdx++}
        OR LOWER(TRIM(from_city)) LIKE $${paramIdx++}
        OR LOWER(TRIM(to_city)) LIKE $${paramIdx++}
        OR LOWER(TRIM(customer)) LIKE $${paramIdx++}
        OR LOWER(TRIM(equipment_code)) LIKE $${paramIdx++}
      )`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Validar ordenamiento
    const validSortColumns = ['date', 'arrival_time', 'work_order', 'driver_code', 'from_city', 'to_city']
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'date'
    const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'

    // ============================================================
    // QUERY PRINCIPAL CON PAGINACION
    // ============================================================

    const query = `
      SELECT
        driver_code,
        work_order,
        bill_of_lading,
        date,
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
        delivery_date,
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
      ORDER BY ${safeSortBy} ${safeSortOrder}, arrival_time DESC
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
