import { getSql } from './_lib/db.js'
import { neon } from '@neondatabase/serverless'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const { type, date } = req.query

      // Verificar si DATABASE_URL_NBCW está configurada
      const externalUrl = process.env.DATABASE_URL_NBCW
      
      if (!externalUrl) {
        console.error('DATABASE_URL_NBCW not configured')
        return res.status(500).json({
          error: 'DATABASE_URL_NBCW not configured',
          details: 'Please configure the DATABASE_URL_NBCW environment variable in Vercel to connect to the NBCW database'
        })
      }

      // Si hay URL configurada, intentar conectar a la base de datos real
      try {
        const externalSql = neon(externalUrl)
        
        let query = `
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
            tablecode as table_code
          FROM tpr 
          WHERE 1=1
        `

        // Filtrar por tipo de movimiento (salidas pendientes)
        if (type === 'pending') {
          query += ` AND status = 'OPEN'`
        } else if (type === 'empty') {
          query += ` AND (eqpcode LIKE '%** Botada **%' OR tablecode = 'BOTADA')`
        }

        // Filtrar por fecha si se proporciona
        if (date) {
          query += ` AND fecha = '${date}'`
        }

        // Ordenar por fecha y hora
        query += ` ORDER BY fecha DESC, timearrv DESC`

        // Ejecutar query en base de datos externa
        // neon() requiere formato tagged-template, para queries dinamicas usamos array
        const movements = await externalSql([query])

        return res.status(200).json({
          success: true,
          data: movements,
          count: movements.length
        })
      } catch (dbError) {
        console.error('Database connection error:', dbError)
        return res.status(500).json({
          error: 'Failed to connect to NBCW database',
          details: dbError.message
        })
      }

    } catch (error) {
      console.error('TPR Query Error:', error)
      return res.status(500).json({ 
        error: 'Failed to query TPR database',
        details: error.message 
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
