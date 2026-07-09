import sql from 'mssql'
import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { appendFileSync, existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env') })

const LOG_DIR = join(__dirname, 'logs')
if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR)

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0]
const logFile = join(LOG_DIR, `sync-${timestamp}.log`)
const originalLog = console.log
const originalError = console.error

function writeToLog(level, args) {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
  const ts = new Date().toISOString()
  const line = `[${ts}] ${level}: ${message}`
  if (level === 'ERROR') originalError(line)
  else originalLog(line)
  try {
    appendFileSync(logFile, line + '\n')
  } catch (writeErr) {
    // ignorar errores de escritura
  }
}

console.log = (...args) => writeToLog('INFO', args)
console.error = (...args) => writeToLog('ERROR', args)

const SQLSERVER_PORT = process.env.SQLSERVER_PORT
  ? parseInt(process.env.SQLSERVER_PORT, 10)
  : null

const SQLSERVER_HOST = process.env.SQLSERVER_HOST
const SQLSERVER_DATABASE = process.env.SQLSERVER_DATABASE || 'GPSActivity'
const SQLSERVER_USER = process.env.SQLSERVER_USER
const SQLSERVER_PASSWORD = process.env.SQLSERVER_PASSWORD ? process.env.SQLSERVER_PASSWORD.trim() : process.env.SQLSERVER_PASSWORD
const SQLSERVER_INSTANCE = process.env.SQLSERVER_INSTANCE

const SQLSERVER_CONFIG = {
  server: SQLSERVER_HOST,
  database: SQLSERVER_DATABASE,
  user: SQLSERVER_USER,
  password: SQLSERVER_PASSWORD,
  options: {
    encrypt: false
  },
  connectionTimeout: 30000,
  requestTimeout: 60000
}

// Si se configura SQLSERVER_PORT, se conecta directo por puerto TCP.
// Si no, se intenta con la instancia nombrada (requiere SQL Server Browser).
if (SQLSERVER_PORT) {
  SQLSERVER_CONFIG.port = SQLSERVER_PORT
} else if (SQLSERVER_INSTANCE) {
  SQLSERVER_CONFIG.options.instanceName = SQLSERVER_INSTANCE
}

const NEON_URL = process.env.DATABASE_URL
const DATE_FORMAT = (process.env.SQLSERVER_DATE_FORMAT || 'MDY').toUpperCase()

/**
 * Parsea fechas de SQL Server a formato ISO YYYY-MM-DD.
 * Soporta MDY, DMY y ISO. Si el servidor esta en español, configura
 * SQLSERVER_DATE_FORMAT=DMY en el .env.
 */
function parseSqlDate(dateStr) {
  if (!dateStr || String(dateStr).trim() === '') return null
  const str = String(dateStr).trim()

  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str

  // MM/DD/YYYY o DD/MM/YYYY
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const [, p1, p2, year] = slashMatch
    let month, day
    if (DATE_FORMAT === 'DMY') {
      day = p1.padStart(2, '0')
      month = p2.padStart(2, '0')
    } else {
      month = p1.padStart(2, '0')
      day = p2.padStart(2, '0')
    }
    if (parseInt(month) > 12) {
      // Si el mes resultante es invalido, invertir interpretacion
      const temp = month
      month = day
      day = temp
    }
    return `${year}-${month}-${day}`
  }

  // MMDDYYYY o DDMMYYYY sin separadores
  if (/^\d{8}$/.test(str)) {
    let month, day
    if (DATE_FORMAT === 'DMY') {
      day = str.substring(0, 2)
      month = str.substring(2, 4)
    } else {
      month = str.substring(0, 2)
      day = str.substring(2, 4)
    }
    const year = str.substring(4, 8)
    return `${year}-${month}-${day}`
  }

  // Intentar Date nativo como ultimo recurso
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  return null
}

async function syncTprToNeon() {
  const startTime = new Date()
  console.log('Iniciando sincronizacion TPR...')
  console.log('Configuracion:', {
    sqlServer: SQLSERVER_HOST,
    port: SQLSERVER_PORT || 'default',
    instance: SQLSERVER_INSTANCE || 'none',
    database: SQLSERVER_DATABASE,
    connectionMode: SQLSERVER_CONFIG.connectionString ? 'connectionString' : 'configObject',
    dateFormat: DATE_FORMAT,
    syncDays: process.env.TPR_SYNC_DAYS || 30
  })

  let sqlPool = null
  let neonClient = null

  try {
    console.log('Conectando a SQL Server...')
    sqlPool = await sql.connect(SQLSERVER_CONFIG)
    console.log('Conectado a SQL Server')

    const result = await sqlPool.request().query(`
      SELECT
        HASHBYTES('MD5', ISNULL(RTRIM(WONO), '') + '|' +
          ISNULL(RTRIM(TRUCKID), '') + '|' +
          ISNULL(RTRIM(FECHA), '') + '|' +
          ISNULL(RTRIM(FROMD), '') + '|' +
          ISNULL(RTRIM(TOD), '') + '|' +
          ISNULL(RTRIM(TIMEARRV), '')
        ) AS sql_id,
        RTRIM(DRVCODE)   AS drvcode,
        RTRIM(WONO)      AS wono,
        RTRIM(BLNO)      AS blno,
        RTRIM(FECHA)     AS fecha,
        RTRIM(FROMD)     AS fromd,
        RTRIM(FROMCITY)  AS fromcity,
        RTRIM(FROMEDO)   AS fromedo,
        RTRIM(TOD)       AS tod,
        RTRIM(TOCITY)    AS tocity,
        RTRIM(TOEDO)     AS toedo,
        RTRIM(TIPMOV)    AS tipmov,
        RTRIM(STATUS)    AS status,
        RTRIM(EL)        AS el,
        RTRIM(EQPCODE)   AS eqpcode,
        RTRIM(DELDATE)   AS deldate,
        RTRIM(CSTMER)    AS cstmer,
        RTRIM(TIMEARRV)  AS timearrv,
        RTRIM(TIMEDEPAR) AS timedepar,
        RTRIM(OPER)      AS oper,
        RTRIM(TRUCKID)   AS truckid,
        RTRIM(SEAL)      AS seal,
        RTRIM(INSTRUC1)  AS instruc1,
        RTRIM(INSTRUC2)  AS instruc2,
        RTRIM(AMOUNT)    AS amount,
        RTRIM(TABLECODE) AS tablecode,
        RTRIM(TRXCODE)   AS trxcode
      FROM tpr
      ORDER BY FECHA DESC, TIMEARRV DESC
    `)

    const rows = result.recordset
    console.log(`Leidos ${rows.length} registros de SQL Server`)

    if (rows.length === 0) {
      console.log('No hay registros para sincronizar')
      return
    }

    console.log('Conectando a Neon...')
    neonClient = new pg.Client({
      connectionString: NEON_URL,
      ssl: { rejectUnauthorized: false }
    })
    await neonClient.connect()
    console.log('Conectado a Neon')

    // Asegurar que la tabla exista con el esquema correcto. Si no existe o tiene
    // columnas viejas (inglés) o falta sql_id, se recrea. Si ya existe con el
    // esquema español y sql_id, solo se limpian los datos para preservar los ids
    // estables y que las inspecciones guardadas sigan cruzando correctamente.
    let recreateTable = false
    try {
      const tableCheck = await neonClient.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'tpr' AND column_name IN ('drvcode', 'sql_id')
      `)
      if (tableCheck.rows.length < 2) {
        recreateTable = true
        await neonClient.query('DROP TABLE IF EXISTS tpr')
      }
    } catch (checkErr) {
      recreateTable = true
      await neonClient.query('DROP TABLE IF EXISTS tpr')
    }

    await neonClient.query(`
      CREATE TABLE IF NOT EXISTS tpr (
        id SERIAL PRIMARY KEY,
        sql_id VARCHAR(50) UNIQUE,
        drvcode VARCHAR(50),
        wono VARCHAR(50),
        blno VARCHAR(50),
        fecha VARCHAR(12),
        fromd VARCHAR(50),
        fromcity VARCHAR(100),
        fromedo VARCHAR(50),
        tod VARCHAR(50),
        tocity VARCHAR(100),
        toedo VARCHAR(50),
        tipmov VARCHAR(50),
        status VARCHAR(50),
        el VARCHAR(50),
        eqpcode VARCHAR(100),
        deldate VARCHAR(12),
        cstmer VARCHAR(100),
        timearrv VARCHAR(20),
        timedepar VARCHAR(20),
        oper VARCHAR(50),
        truckid VARCHAR(50),
        seal VARCHAR(50),
        instruc1 TEXT,
        instruc2 TEXT,
        amount VARCHAR(10),
        tablecode VARCHAR(50),
        trxcode VARCHAR(50),
        synced_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await neonClient.query(`
      CREATE INDEX IF NOT EXISTS idx_tpr_fromd ON tpr(fromd);
      CREATE INDEX IF NOT EXISTS idx_tpr_status ON tpr(status);
      CREATE INDEX IF NOT EXISTS idx_tpr_el ON tpr(el);
      CREATE INDEX IF NOT EXISTS idx_tpr_fecha ON tpr(fecha);
      CREATE INDEX IF NOT EXISTS idx_tpr_wono ON tpr(wono);
      CREATE INDEX IF NOT EXISTS idx_tpr_blno ON tpr(blno);
      CREATE INDEX IF NOT EXISTS idx_tpr_truckid ON tpr(truckid);
      CREATE INDEX IF NOT EXISTS idx_tpr_synced_at ON tpr(synced_at);
    `)

    const syncDays = parseInt(process.env.TPR_SYNC_DAYS) || 30
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - syncDays)
    const cutoffStr = cutoffDate.toISOString().split('T')[0]
    console.log(`Filtrando registros desde ${cutoffStr} (ultimos ${syncDays} dias)`)

    const filteredRows = rows.filter(row => {
      const rowDate = parseSqlDate(row.fecha)
      return rowDate && rowDate >= cutoffStr
    })
    console.log(`${filteredRows.length} registros dentro del rango de sincronizacion`)

    if (filteredRows.length === 0) {
      console.log('No hay registros dentro del rango para sincronizar')
      return
    }

    await neonClient.query('BEGIN')
        if (recreateTable) {
      console.log('Recreando tabla tpr (DROP TABLE)')
    } else {
      console.log('Limpiando datos tpr (DELETE FROM)')
    }

    await neonClient.query('BEGIN')
    if (!recreateTable) {
      await neonClient.query('DELETE FROM tpr')
    }

    const columns = [
      'sql_id', 'drvcode', 'wono', 'blno', 'fecha', 'fromd', 'fromcity', 'fromedo',
      'tod', 'tocity', 'toedo', 'tipmov', 'status', 'el', 'eqpcode',
      'deldate', 'cstmer', 'timearrv', 'timedepar', 'oper', 'truckid', 'seal',
      'instruc1', 'instruc2', 'amount', 'tablecode', 'trxcode', 'synced_at'
    ].join(', ')

    const batchSize = 1000
    let inserted = 0

    for (let i = 0; i < filteredRows.length; i += batchSize) {
      const batch = filteredRows.slice(i, i + batchSize)
      const values = []
      const params = []
      let paramIndex = 1

      for (const row of batch) {
        const placeholders = Array.from({ length: 27 }, (_, j) => `$${paramIndex + j}`).join(', ')
        values.push(`(${placeholders}, NOW())`)

        params.push(
          row.sql_id || null,
          row.drvcode || null,
          row.wono || null,
          row.blno || null,
          row.fecha || null,
          row.fromd || null,
          row.fromcity || null,
          row.fromedo || null,
          row.tod || null,
          row.tocity || null,
          row.toedo || null,
          row.tipmov || null,
          row.status || null,
          row.el || null,
          row.eqpcode || null,
          row.deldate || null,
          row.cstmer || null,
          row.timearrv || null,
          row.timedepar || null,
          row.oper || null,
          row.truckid || null,
          row.seal || null,
          row.instruc1 || null,
          row.instruc2 || null,
          row.amount || null,
          row.tablecode || null,
          row.trxcode || null
        )
        paramIndex += 26
      }

      const query = `INSERT INTO tpr (${columns}) VALUES ${values.join(', ')}`
      await neonClient.query(query, params)
      inserted += batch.length
      console.log(`Insertados ${inserted} de ${filteredRows.length} registros...`)
    }

    await neonClient.query('COMMIT')

    const endTime = new Date()
    const duration = endTime - startTime
    console.log(`Sincronizacion completa: ${inserted} insertados, ${rows.length} total, ${duration}ms`)

  } catch (error) {
    console.error('Error en sincronizacion:', error?.message || error)
    console.error('Error detalle:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      originalError: error?.originalError ? (error.originalError.message || error.originalError) : null
    })
    try {
      if (neonClient) await neonClient.query('ROLLBACK')
    } catch (rollbackErr) {
      // ignorar
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

syncTprToNeon()
