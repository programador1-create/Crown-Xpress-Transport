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
    const { period = 'day' } = req.query

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
    // 1. MÉTRICAS GENERALES
    // ============================================================
    const generalMetrics = await sql`
      SELECT
        COUNT(*) as total_inspections,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM inspections
      WHERE ${sql.unsafe(dateCondition)}
    `

    // ============================================================
    // 2. MÉTRICAS POR DÍA (ÚLTIMOS 7 DÍAS)
    // ============================================================
    const dailyMetrics = await sql`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total_inspections,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM inspections
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `

    // ============================================================
    // 3. MÉTRICAS POR GUARD (SIMPLIFICADO)
    // ============================================================
    const guardMetrics = await sql`
      SELECT
        guard_name,
        COUNT(*) as total_inspections,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM inspections
      WHERE ${sql.unsafe(dateCondition)}
        AND guard_name IS NOT NULL
      GROUP BY guard_name
      ORDER BY total_inspections DESC
    `

    // ============================================================
    // RESPUESTA
    // ============================================================
    return res.status(200).json({
      success: true,
      period,
      dateLabel,
      general: generalMetrics[0] || {},
      byDay: dailyMetrics,
      byGuard: guardMetrics
    })

  } catch (error) {
    console.error('Metrics Query Error:', error)
    return res.status(500).json({
      error: 'Failed to query metrics',
      details: error.message
    })
  }
}
