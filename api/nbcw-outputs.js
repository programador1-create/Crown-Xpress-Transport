import { getNbcwSql } from './_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      // Get user info from Authorization header or query
      const authHeader = req.headers.authorization
      const userLocation = req.query.location || req.headers['x-user-location']
      
      if (!userLocation) {
        return res.status(400).json({ 
          error: 'User location is required' 
        })
      }

      const sql = getNbcwSql()
      
      // Extract yard code from location and normalize
      // Handle formats like 'CXT6', 'CXT6 Yard', 'yard 6', etc.
      let yardCode = userLocation.toLowerCase()
      
      // Extract just the alphanumeric part (e.g., 'cxt6' from 'cxt6 yard')
      yardCode = yardCode.replace(/[^a-z0-9]/g, '')
      
      // For yard 6, also try 'cxt6' if user location contains just '6'
      if (yardCode === '6') {
        yardCode = 'cxt6'
      }
      
      // Debug logging
      console.log('NBCW Debug - User Location:', userLocation)
      console.log('NBCW Debug - Extracted Yard Code:', yardCode)
      console.log('NBCW Debug - Final Query Code:', yardCode.toUpperCase())
      
      // Query TPR table for this yard's data
      // Handle multiple formats: 'CXT6', 'CXT6 ', ' CXT6', etc.
      const outputs = await sql`
        SELECT 
          DRVCODE,
          WONO,
          BLNO,
          FECHA,
          FROMD,
          FROMCITY,
          FROMEDO,
          TOD,
          TOCITY,
          TOEDO,
          TIPMOV,
          STATUS,
          EL,
          EQPCODE,
          DELDATE,
          CSTMER,
          TIMEARRV,
          TIMEDEPAR,
          OPER,
          USTIMEIN,
          USTIMEOUT,
          MXMXCSTIN,
          MXUSCSTIN,
          MXTIMEOUT,
          TRUCKID,
          BLTIME,
          TARRFROM,
          USRUPDD,
          USRUPDT,
          USRUPDD,
          USRUPDT,
          USRADD,
          USRADDD,
          USRADDT,
          INSTRUC1,
          INSTRUC2,
          RL,
          AMOUNT,
          TABLECODE,
          TRXCODE,
          SEAL
        FROM tpr 
        WHERE TRIM(FROMD) = ${yardCode.toUpperCase()}
           OR TRIM(FROMD) LIKE ${'%' + yardCode.toUpperCase() + '%'}
        ORDER BY FECHA DESC, TIMEARRV DESC
        LIMIT 50
      `

      console.log('NBCW Debug - Query Results Count:', outputs.length)
      if (outputs.length > 0) {
        console.log('NBCW Debug - Sample FROMD values:', outputs.map(o => o.FROMD).slice(0, 3))
      }

      return res.status(200).json({
        success: true,
        yardCode: yardCode.toUpperCase(),
        data: outputs,
        count: outputs.length
      })

    } catch (error) {
      console.error('NBCW Outputs Error:', error)
      return res.status(500).json({ 
        error: 'Failed to fetch NBCW outputs',
        details: error.message 
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
