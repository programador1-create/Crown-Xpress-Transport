import { getSql } from './_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const sql = getSql()
      const { type, date } = req.query

      // Conectar a la base de datos externa gpsactivity
      // NOTA: Necesitarás configurar la conexión a gpsactivity en tu entorno
      const externalSql = getExternalSql() // Función para conectar a gpsactivity
      
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

      const params = []

      // Filtrar por tipo de movimiento (botadas = vacías)
      if (type === 'empty') {
        query += ` AND (eqpcode LIKE '%** Botada **%' OR tablecode = 'BOTADA')`
      }

      // Filtrar por fecha si se proporciona
      if (date) {
        query += ` AND fecha = ${date}`
      }

      // Ordenar por fecha y hora
      query += ` ORDER BY fecha DESC, timearrv DESC`

      // Ejecutar query en base de datos externa
      const movements = await externalSql(query, params)

      return res.status(200).json({
        success: true,
        data: movements,
        count: movements.length
      })

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

// Función para conectar a la base de datos externa NBCW
function getExternalSql() {
  const { neon } = require('@neondatabase/serverless')
  const externalUrl = process.env.DATABASE_URL_NBCW
  if (!externalUrl) {
    throw new Error('DATABASE_URL_NBCW not configured')
  }
  return neon(externalUrl)
}
