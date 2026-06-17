import { getNbcwSql } from './_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      // Check environment variable
      console.log('NBCW Test - Checking DATABASE_URL_NBCW...')
      const dbUrl = process.env.DATABASE_URL_NBCW
      
      if (!dbUrl) {
        return res.status(500).json({ 
          success: false,
          error: 'DATABASE_URL_NBCW not found',
          env_vars: Object.keys(process.env).filter(k => k.includes('DATABASE'))
        })
      }

      console.log('NBCW Test - DB URL found (length:', dbUrl.length, ')')

      // Test connection
      console.log('NBCW Test - Attempting connection...')
      const sql = getNbcwSql()
      console.log('NBCW Test - Connection successful')

      // Test query
      console.log('NBCW Test - Running test query...')
      const result = await sql`SELECT COUNT(*) as total_records FROM tpr`
      console.log('NBCW Test - Query result:', result)

      // Test CXT6 query
      console.log('NBCW Test - Running CXT6 query...')
      const cxt6Results = await sql`
        SELECT WONO, DRVCODE, FROMD, TOD 
        FROM tpr 
        WHERE TRIM(FROMD) = 'CXT6' OR TRIM(TOD) = 'CXT6'
        LIMIT 5
      `
      console.log('NBCW Test - CXT6 results:', cxt6Results)

      return res.status(200).json({
        success: true,
        message: 'NBCW connection test successful',
        total_records: result[0]?.total_records || 0,
        cxt6_records: cxt6Results.length,
        sample_cxt6: cxt6Results
      })

    } catch (error) {
      console.error('NBCW Test Error:', error)
      console.error('NBCW Test Stack:', error.stack)
      
      return res.status(500).json({ 
        success: false,
        error: error.message,
        stack: error.stack
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
