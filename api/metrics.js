import { getSql } from './_lib/db.js'

function isValidISODate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime())
}

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
    const { period = 'day', yardCode = 'all' } = req.query
    // Fecha y offset enviados desde el frontend en zona horaria local.
    // created_at se almacena en UTC; convirtiéndolo a la zona del usuario
    // antes de extraer la fecha evitamos desfaces de un día (problema en UTC-7).
    const anchorDate = isValidISODate(req.query.date) ? req.query.date : null
    const rawOffset = parseInt(req.query.offset, 10)
    const offset = !isNaN(rawOffset) ? rawOffset : 0
    const dateLiteral = anchorDate ? `'${anchorDate}'::date` : 'CURRENT_DATE'
    const localDateExpr = `(created_at AT TIME ZONE 'UTC' - INTERVAL '${offset} minutes')::date`

    // ============================================================
    // CALCULAR RANGO DE FECHAS SEGÚN PERIODO
    // ============================================================
    let dateCondition = ''
    let dateLabel = ''

    if (period === 'day') {
      dateCondition = `${localDateExpr} = ${dateLiteral}`
      dateLabel = 'hoy'
    } else if (period === 'week') {
      dateCondition = `${localDateExpr} >= DATE_TRUNC('week', ${dateLiteral})::date AND ${localDateExpr} < (DATE_TRUNC('week', ${dateLiteral}) + INTERVAL '7 days')::date`
      dateLabel = 'esta semana'
    } else if (period === 'month') {
      dateCondition = `${localDateExpr} >= DATE_TRUNC('month', ${dateLiteral})::date AND ${localDateExpr} < (DATE_TRUNC('month', ${dateLiteral}) + INTERVAL '1 month')::date`
      dateLabel = 'este mes'
    } else {
      return res.status(400).json({ error: 'Invalid period. Use: day, week, or month' })
    }

    const isAllYards = !yardCode || yardCode === 'all'

    // ============================================================
    // 0. LISTA DE YARDAS (existentes y recién creadas)
    // ============================================================
    const yards = await sql`
      SELECT id, name, code, type FROM yards
      WHERE is_active = true
      ORDER BY type, name
    `

    // ============================================================
    // 1. MÉTRICAS GENERALES
    // ============================================================
    // NOTA: Una inspección con status = 'pending' significa que el guard YA
    // la realizó y firmó, solo está esperando la firma/aprobación del
    // supervisor. Por lo tanto CUENTA como "hecha/registrada", igual que
    // ya lo trata tpr.js (status NOT IN ('superseded')). Solo 'superseded'
    // (reemplazada por una reconfirmación) se excluye del total.
    const generalMetrics = isAllYards
      ? await sql`
          SELECT
            COUNT(CASE WHEN status <> 'superseded' THEN 1 END) as total_inspections,
            COUNT(CASE WHEN status IN ('completed', 'audited') THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'audited' THEN 1 END) as audited
          FROM inspections
          WHERE ${sql.unsafe(dateCondition)}
        `
      : await sql`
          SELECT
            COUNT(CASE WHEN status <> 'superseded' THEN 1 END) as total_inspections,
            COUNT(CASE WHEN status IN ('completed', 'audited') THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'audited' THEN 1 END) as audited
          FROM inspections
          WHERE ${sql.unsafe(dateCondition)}
            AND location = ${yardCode}
        `

    // ============================================================
    // 2. MÉTRICAS POR DÍA (ÚLTIMOS 7 DÍAS DESDE LA FECHA ANCLA)
    // ============================================================
    const dailyMetrics = isAllYards
      ? await sql`
          SELECT
            ${sql.unsafe(localDateExpr)} as date,
            COUNT(CASE WHEN status <> 'superseded' THEN 1 END) as total_inspections,
            COUNT(CASE WHEN status IN ('completed', 'audited') THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
          FROM inspections
          WHERE ${sql.unsafe(`${localDateExpr} >= ${dateLiteral} - INTERVAL '7 days'`)}
          GROUP BY ${sql.unsafe(localDateExpr)}
          ORDER BY date DESC
        `
      : await sql`
          SELECT
            ${sql.unsafe(localDateExpr)} as date,
            COUNT(CASE WHEN status <> 'superseded' THEN 1 END) as total_inspections,
            COUNT(CASE WHEN status IN ('completed', 'audited') THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
          FROM inspections
          WHERE ${sql.unsafe(`${localDateExpr} >= ${dateLiteral} - INTERVAL '7 days'`)}
            AND location = ${yardCode}
          GROUP BY ${sql.unsafe(localDateExpr)}
          ORDER BY date DESC
        `

    // ============================================================
    // 3. MÉTRICAS POR GUARD
    // ============================================================
    const guardMetrics = isAllYards
      ? await sql`
          SELECT
            guard_name,
            COUNT(CASE WHEN status <> 'superseded' THEN 1 END) as total_inspections,
            COUNT(CASE WHEN status IN ('completed', 'audited') THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
          FROM inspections
          WHERE ${sql.unsafe(dateCondition)}
            AND guard_name IS NOT NULL
          GROUP BY guard_name
          ORDER BY total_inspections DESC
        `
      : await sql`
          SELECT
            guard_name,
            COUNT(CASE WHEN status <> 'superseded' THEN 1 END) as total_inspections,
            COUNT(CASE WHEN status IN ('completed', 'audited') THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
          FROM inspections
          WHERE ${sql.unsafe(dateCondition)}
            AND guard_name IS NOT NULL
            AND location = ${yardCode}
          GROUP BY guard_name
          ORDER BY total_inspections DESC
        `

    // ============================================================
    // 4. MÉTRICAS POR YARDA (SOLO REPORTE GENERAL)
    // ============================================================
    let byYard = []
    if (isAllYards) {
      const yardMetrics = await sql`
        SELECT
          location,
          COUNT(CASE WHEN status <> 'superseded' THEN 1 END) as total_inspections,
          COUNT(CASE WHEN status IN ('completed', 'audited') THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
        FROM inspections
        WHERE ${sql.unsafe(dateCondition)}
          AND location IS NOT NULL
        GROUP BY location
        ORDER BY total_inspections DESC
      `

      // Combinar con el catálogo de yardas para mostrar nombre completo
      // (incluye yardas sin inspecciones aún, y las recién creadas)
      const yardMap = new Map(yardMetrics.map(y => [y.location, y]))
      byYard = yards.map(y => {
        const stats = yardMap.get(y.code) || { total_inspections: 0, completed: 0, pending: 0 }
        return {
          yard_id: y.id,
          yard_name: y.name,
          yard_code: y.code,
          yard_type: y.type,
          total_inspections: Number(stats.total_inspections) || 0,
          completed: Number(stats.completed) || 0,
          pending: Number(stats.pending) || 0,
        }
      }).sort((a, b) => b.total_inspections - a.total_inspections)
    }

    // ============================================================
    // 5. NBCW: PENDIENTES REALES (movimientos TPR vs inspecciones hechas)
    // ============================================================
    // Esto es distinto de "pending" de arriba (que es aprobación de
    // supervisor). Aquí comparamos contra el total de movimientos NBCW
    // (tabla tpr) del periodo para saber cuántos AÚN NO se han inspeccionado
    // en absoluto. NOTA: la sincronización de tpr solo retiene ~2-7 días,
    // por lo que esta comparación es más precisa para period=day.
    let tprDateCondition = ''
    const tprDateLiteral = anchorDate ? `TO_DATE('${anchorDate}', 'YYYY-MM-DD')` : 'CURRENT_DATE'
    if (period === 'day') {
      tprDateCondition = `TO_DATE(fecha, 'MM/DD/YYYY') = ${tprDateLiteral}`
    } else if (period === 'week') {
      tprDateCondition = `TO_DATE(fecha, 'MM/DD/YYYY') >= DATE_TRUNC('week', ${tprDateLiteral})`
    } else {
      tprDateCondition = `TO_DATE(fecha, 'MM/DD/YYYY') >= DATE_TRUNC('month', ${tprDateLiteral})`
    }

    let nbcw = { total: 0, inspected: 0, pending: 0 }
    let nbcwByYard = []
    try {
      const tprRows = isAllYards
        ? await sql`
            SELECT wono, fromd
            FROM tpr
            WHERE ${sql.unsafe(tprDateCondition)}
          `
        : await sql`
            SELECT wono, fromd
            FROM tpr
            WHERE ${sql.unsafe(tprDateCondition)}
              AND TRIM(fromd) = ${yardCode}
          `

      // El cruce se hace por WORK ORDER (wono), igual que en tpr.js. Así una
      // misma caja/tractor puede inspeccionarse varias veces al día para
      // movimientos distintos, y no se generan falsos positivos por números
      // reutilizados entre días.
      const inspectedRows = await sql`
        SELECT DISTINCT UPPER(TRIM(wono)) AS wono
        FROM inspections
        WHERE status <> 'superseded'
          AND wono IS NOT NULL
          AND TRIM(wono) <> ''
          AND ${sql.unsafe(dateCondition)}
      `
      const inspectedSet = new Set()
      for (const row of inspectedRows) {
        if (row.wono) inspectedSet.add(row.wono)
      }

      const perYard = new Map()
      for (const m of tprRows) {
        const wono = m.wono?.toString().trim().toUpperCase()
        const already = !!(wono && inspectedSet.has(wono))

        nbcw.total++
        if (already) nbcw.inspected++

        const yc = m.fromd?.toString().trim().toUpperCase()
        if (yc) {
          if (!perYard.has(yc)) perYard.set(yc, { total: 0, inspected: 0 })
          const entry = perYard.get(yc)
          entry.total++
          if (already) entry.inspected++
        }
      }
      nbcw.pending = Math.max(0, nbcw.total - nbcw.inspected)

      if (isAllYards) {
        nbcwByYard = yards
          .map(y => {
            const e = perYard.get(y.code?.toUpperCase()) || { total: 0, inspected: 0 }
            return {
              yard_id: y.id,
              yard_name: y.name,
              yard_code: y.code,
              nbcw_total: e.total,
              nbcw_inspected: e.inspected,
              nbcw_pending: Math.max(0, e.total - e.inspected),
            }
          })
          .filter(y => y.nbcw_total > 0)
          .sort((a, b) => b.nbcw_total - a.nbcw_total)
      }
    } catch (nbcwErr) {
      console.warn('NBCW cross-check failed (non-fatal):', nbcwErr.message)
    }

    // ============================================================
    // RESPUESTA
    // ============================================================
    return res.status(200).json({
      success: true,
      period,
      dateLabel,
      yardCode: isAllYards ? 'all' : yardCode,
      isAllYards,
      yards,
      general: generalMetrics[0] || {},
      byDay: dailyMetrics,
      byGuard: guardMetrics,
      byYard,
      nbcw,
      nbcwByYard
    })

  } catch (error) {
    console.error('Metrics Query Error:', error)
    return res.status(500).json({
      error: 'Failed to query metrics',
      details: error.message
    })
  }
}
