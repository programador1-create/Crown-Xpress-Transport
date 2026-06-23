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

  try {
    const { type, date, yardCode } = req.query

    // SQL Proxy URL — set SQLPROXY_URL in Vercel env vars pointing to the Cloudflare tunnel
    const proxyUrl = process.env.SQLPROXY_URL
    if (!proxyUrl) {
      return res.status(500).json({
        error: 'SQLPROXY_URL not configured',
        details: 'Set SQLPROXY_URL in Vercel to the Cloudflare tunnel URL (e.g. https://xxxx.trycloudflare.com)'
      })
    }

    // Build query params for the local proxy
    const params = new URLSearchParams({ type: type || 'pending' })
    if (yardCode) params.append('yardCode', yardCode)
    if (date) params.append('date', date)

    // Call the local SQL proxy through the Cloudflare tunnel
    // cf-bypass-tunnel-reminder bypasses the Cloudflare quick-tunnel warning page
    const proxyRes = await fetch(`${proxyUrl}/tpr?${params}`, {
      headers: {
        'Accept': 'application/json',
        'cf-bypass-tunnel-reminder': 'x'
      },
      signal: AbortSignal.timeout(25000)
    })

    if (!proxyRes.ok) {
      const err = await proxyRes.text()
      return res.status(502).json({
        error: 'SQL proxy returned an error',
        details: err
      })
    }

    const proxyData = await proxyRes.json()
    const allMovements = proxyData.data || []

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
