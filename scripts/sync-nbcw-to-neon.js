import sql from 'mssql'
import { Client } from '@neondatabase/serverless'
import 'dotenv/config'

// ============================================================
// Script de sincronizacion NBCW (SQL Server) -> Neon (PostgreSQL)
// Corre este script cada 5 minutos con cron en una PC/Raspberry Pi
// ubicada en la red donde esta SQL Server de NBCW.
// ============================================================

const SQLSERVER_CONFIG = {
  server: process.env.SQLSERVER_HOST,
  port: parseInt(process.env.SQLSERVER_PORT) || 1433,
  database: process.env.SQLSERVER_DATABASE || 'GPSActivity',
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  options: {
    instanceName: process.env.SQLSERVER_INSTANCE || 'BKUPEXEC',
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  connectionTimeout: 15000,
  requestTimeout: 30000
}

const NEON_URL = process.env.DATABASE_URL

/**
 * Parsea fechas de SQL Server (varchar) a formato ISO YYYY-MM-DD.
 * Soporta formatos comunes: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, MMDDYYYY, DDMMYYYY
 */
function parseSqlDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null
  const str = dateStr.trim()

  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str
  }

  // Formato MM/DD/YYYY o DD/MM/YYYY
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const [, p1, p2, year] = slashMatch
    // Asumir MM/DD/YYYY (formato 101 de SQL Server)
    const month = p1.padStart(2, '0')
    const day = p2.padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Formato MMDDYYYY o DDMMYYYY (sin separadores)
  if (/^\d{8}$/.test(str)) {
    const month = str.substring(0, 2)
    const day = str.substring(2, 4)
    const year = str.substring(4, 8)
    return `${year}-${month}-${day}`
  }

  // Intentar parse con Date nativo
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  return null
}

async function syncTprToNeon() {
  const startTime = new Date()
  console.log(`[${startTime.toISOString()}] Iniciando sincronizacion tpr...`)

  let sqlPool = null
  let neonClient = null

  try {
    // 1. Conectar a SQL Server
    sqlPool = await sql.connect(SQLSERVER_CONFIG)
    console.log('Conectado a SQL Server NBCW')

    // 2. Leer datos de tpr (ultimos 7 dias)
    // FECHA y DELDATE son varchar(12) en SQL Server, no DATE
    const result = await sqlPool.request().query(`
      SELECT
        RTRIM(DRVCODE)   AS driver_code,
        RTRIM(WONO)      AS work_order,
        RTRIM(BLNO)      AS bill_of_lading,
        RTRIM(FECHA)     AS fecha_raw,
        RTRIM(FROMD)     AS from_code,
        RTRIM(FROMCITY)  AS from_city,
        RTRIM(FROMEDO)   AS from_state,
        RTRIM(TOD)       AS to_code,
        RTRIM(TOCITY)    AS to_city,
        RTRIM(TOEDO)     AS to_state,
        RTRIM(TIPMOV)    AS movement_type,
        RTRIM(STATUS)    AS status,
        RTRIM(EL)        AS equipment_type,
        RTRIM(EQPCODE)   AS equipment_code,
        RTRIM(DELDATE)   AS deldate_raw,
        RTRIM(CSTMER)    AS customer,
        RTRIM(TIMEARRV)  AS arrival_time,
        RTRIM(TIMEDEPAR) AS departure_time,
        RTRIM(OPER)      AS operator,
        RTRIM(TRUCKID)   AS truck_id,
        RTRIM(SEAL)      AS seal,
        RTRIM(INSTRUC1)  AS instructions_1,
        RTRIM(INSTRUC2)  AS instructions_2,
        RTRIM(AMOUNT)    AS amount,
        RTRIM(TABLECODE) AS table_code,
        RTRIM(TRXCODE)   AS trx_code
      FROM tpr
      WHERE FECHA >= CONVERT(varchar(10), DATEADD(day, -7, GETDATE()), 101)
      ORDER BY FECHA DESC, TIMEARRV DESC
    `)

    const rows = result.recordset
    console.log(`Leidos ${rows.length} registros de SQL Server`)

    if (rows.length === 0) {
      console.log('No hay registros para sincronizar')
      return
    }

    // 3. Conectar a Neon
    neonClient = new Client(NEON_URL)
    await neonClient.connect()
    console.log('Conectado a Neon')

    // 4. Asegurar que la tabla exista
    await neonClient.query(`
      CREATE TABLE IF NOT EXISTS tpr (
        id SERIAL PRIMARY KEY,
        driver_code VARCHAR(50),
        work_order VARCHAR(50),
        bill_of_lading VARCHAR(50),
        fecha_raw VARCHAR(12),
        date DATE,
        from_code VARCHAR(50),
        from_city VARCHAR(100),
        from_state VARCHAR(50),
        to_code VARCHAR(50),
        to_city VARCHAR(100),
        to_state VARCHAR(50),
        movement_type VARCHAR(50),
        status VARCHAR(50),
        equipment_type VARCHAR(50),
        equipment_code VARCHAR(100),
        deldate_raw VARCHAR(12),
        delivery_date DATE,
        customer VARCHAR(100),
        arrival_time VARCHAR(20),
        departure_time VARCHAR(20),
        operator VARCHAR(50),
        truck_id VARCHAR(50),
        seal VARCHAR(50),
        instructions_1 TEXT,
        instructions_2 TEXT,
        amount VARCHAR(10),
        table_code VARCHAR(50),
        trx_code VARCHAR(50),
        synced_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 5. Crear indices si no existen
    await neonClient.query(`
      CREATE INDEX IF NOT EXISTS idx_tpr_from_code ON tpr(from_code);
      CREATE INDEX IF NOT EXISTS idx_tpr_status ON tpr(status);
      CREATE INDEX IF NOT EXISTS idx_tpr_equipment_type ON tpr(equipment_type);
      CREATE INDEX IF NOT EXISTS idx_tpr_date ON tpr(date);
      CREATE INDEX IF NOT EXISTS idx_tpr_work_order ON tpr(work_order);
      CREATE INDEX IF NOT EXISTS idx_tpr_bill_of_lading ON tpr(bill_of_lading);
      CREATE INDEX IF NOT EXISTS idx_tpr_truck_id ON tpr(truck_id);
      CREATE INDEX IF NOT EXISTS idx_tpr_synced_at ON tpr(synced_at);
    `)

    // 6. Limpiar registros antiguos de mas de 30 dias
    await neonClient.query(`
      DELETE FROM tpr
      WHERE date < CURRENT_DATE - INTERVAL '30 days'
    `)

    // 7. Limpiar e insertar todos los registros (sin duplicados, sin clave natural en tpr SQL Server)
    // Usamos DELETE en lugar de TRUNCATE para poder hacer rollback en caso de error
    await neonClient.query('BEGIN')
    await neonClient.query('DELETE FROM tpr')

    let inserted = 0

    for (const row of rows) {
      const safeDate = parseSqlDate(row.fecha_raw)
      const safeDeliveryDate = parseSqlDate(row.deldate_raw)

      await neonClient.query(
        `
        INSERT INTO tpr (
          driver_code, work_order, bill_of_lading, fecha_raw, date, from_code, from_city, from_state,
          to_code, to_city, to_state, movement_type, status, equipment_type, equipment_code,
          deldate_raw, delivery_date, customer, arrival_time, departure_time, operator, truck_id, seal,
          instructions_1, instructions_2, amount, table_code, trx_code, synced_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, NOW()
        )
        `,
        [
          row.driver_code || null,
          row.work_order || null,
          row.bill_of_lading || null,
          row.fecha_raw || null,
          safeDate,
          row.from_code || null,
          row.from_city || null,
          row.from_state || null,
          row.to_code || null,
          row.to_city || null,
          row.to_state || null,
          row.movement_type || null,
          row.status || null,
          row.equipment_type || null,
          row.equipment_code || null,
          row.deldate_raw || null,
          safeDeliveryDate,
          row.customer || null,
          row.arrival_time || null,
          row.departure_time || null,
          row.operator || null,
          row.truck_id || null,
          row.seal || null,
          row.instructions_1 || null,
          row.instructions_2 || null,
          row.amount || null,
          row.table_code || null,
          row.trx_code || null
        ]
      )
      inserted++
    }

    await neonClient.query('COMMIT')

    const endTime = new Date()
    const duration = endTime - startTime
    console.log(`[${endTime.toISOString()}] Sincronizacion completa: ${inserted} insertados, ${rows.length} total, ${duration}ms`)

  } catch (error) {
    console.error('Error en sincronizacion:', error)
    try {
      if (neonClient) await neonClient.query('ROLLBACK')
    } catch (rollbackErr) {
      // Ignorar error de rollback si no hay transaccion activa
    }
    process.exit(1)
  } finally {
    if (neonClient) {
      await neonClient.end().catch(() => {})
    }
    if (sqlPool) {
      await sqlPool.close().catch(() => {})
    }
  }
}

// Ejecutar sincronizacion
syncTprToNeon()
