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
    const { period = 'day', yardCode } = req.query

    // ============================================================
    // CALCULAR RANGO DE FECHAS SEGÚN PERIODO
    // ============================================================
    let dateCondition = ''
    let dateLabel = ''

    if (period === 'day') {
      dateCondition = `DATE(created_at) = CURRENT_DATE`
      dateLabel = 'hoy'
    } else if (period === 'week') {
      dateCondition = `created_at >= DATE_TRUNC('week', CURRENT_DATE)`
      dateLabel = 'esta semana'
    } else if (period === 'month') {
      dateCondition = `created_at >= DATE_TRUNC('month', CURRENT_DATE)`
      dateLabel = 'este mes'
    } else {
      return res.status(400).json({ error: 'Invalid period. Use: day, week, or month' })
    }

    // ============================================================
    // FILTRO POR YARDA (SI SE PROPORCIONA)
    // ============================================================
    // Temporarily disabled - need to verify correct column name
    let yardCondition = ''
    // if (yardCode) {
    //   const yardCodes = yardCode.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
    //   if (yardCodes.length > 0) {
    //     const escapedYardCodes = yardCodes.map(c => `'${c.replace(/'/g, "''")}'`).join(', ')
    //     yardCondition = `AND location IN (${escapedYardCodes})`
    //   }
    // }

    // ============================================================
    // 1. MÉTRICAS GENERALES
    // ============================================================
    const generalMetrics = await sql`
      SELECT
        COUNT(*) as total_inspections,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'audited' THEN 1 END) as audited,
        COUNT(CASE WHEN status = 'superseded' THEN 1 END) as superseded
      FROM inspections
      WHERE ${sql.unsafe(dateCondition)}
      ${sql.unsafe(yardCondition)}
    `

    // ============================================================
    // 2. MÉTRICAS POR USUARIO (GUARD)
    // ============================================================
    const userMetrics = await sql`
      SELECT
        e.username,
        e.full_name,
        COUNT(i.id) as total_inspections,
        COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN i.status = 'pending' THEN 1 END) as pending
      FROM employees e
      LEFT JOIN inspections i ON e.username = i.guard_name
      WHERE e.role = 'guard'
        AND (${sql.unsafe(dateCondition)} OR i.id IS NULL)
        ${sql.unsafe(yardCondition)}
      GROUP BY e.username, e.full_name
      ORDER BY total_inspections DESC
    `

    // ============================================================
    // 3. MÉTRICAS POR DÍA (ÚLTIMOS 7 DÍAS)
    // ============================================================
    const dailyMetrics = await sql`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total_inspections,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM inspections
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      ${sql.unsafe(yardCondition)}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `

    // ============================================================
    // 4. COMPARACIÓN: LO QUE SE HIZO VS LO QUE FALTÓ
    // ============================================================
    const comparisonMetrics = await sql`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as done,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as missed
      FROM inspections
      WHERE ${sql.unsafe(dateCondition)}
      ${sql.unsafe(yardCondition)}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `

    // ============================================================
    // RESPUESTA
    // ============================================================
    return res.status(200).json({
      success: true,
      period,
      dateLabel,
      general: generalMetrics[0] || {},
      byUser: userMetrics,
      byDay: dailyMetrics,
      comparison: comparisonMetrics
    })

  } catch (error) {
    console.error('Metrics Query Error:', error)
    return res.status(500).json({
      error: 'Failed to query metrics',
      details: error.message
    })
  }
}
