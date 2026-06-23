import sql from 'mssql'

// SQL Server configuration for GPSActivity database
// Uses Vercel environment variables
const config = {
  server: process.env.SQLSERVER_HOST,
  port: parseInt(process.env.SQLSERVER_PORT) || 1433,
  database: process.env.SQLSERVER_DATABASE || 'GPSActivity',
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  options: {
    encrypt: true, // Use encryption (required for Azure)
    trustServerCertificate: true, // Trust self-signed certificates
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
}

let pool = null

/**
 * Get or create SQL Server connection pool
 */
export async function getSqlServerPool() {
  if (!pool) {
    pool = await sql.connect(config)
  }
  return pool
}

/**
 * Close SQL Server connection pool
 */
export async function closeSqlServerPool() {
  if (pool) {
    await pool.close()
    pool = null
  }
}

/**
 * Query tpr table for box/container information
 * Returns all important columns from tpr table
 * @param {string} containerNumber - Container/trailer number to search
 * @returns {Promise<Array>} Array of matching records from tpr table
 */
export async function queryTprTable(containerNumber) {
  try {
    const pool = await getSqlServerPool()
    const result = await pool.request()
      .input('containerNumber', sql.VarChar, containerNumber)
      .query(`
        SELECT 
          DRVCODE, WONO, BLNO, FECHA, FROMD, FROMCITY, FROMEDO,
          TOD, TOCITY, TOEDO, TIPMOV, STATUS, EL, EQPCODE, DELDATE,
          CSTMER, TIMEARRV, TIMEDEPAR, OPER, USTIMEIN, USTIMEOUT,
          MXMXCSTIN, MXUSCSTIN, MXTIMEOUT, TRUCKID, BLTIME, TARRFROM,
          USRUPDD, USRUPDT, USRADD, USRADDD, USRADDT, INSTRUC1, INSTRUC2,
          RL, AMOUNT, TABLECODE, TRXCODE, SEAL
        FROM tpr 
        WHERE BLNO = @containerNumber
        OR SEAL = @containerNumber
        OR TRUCKID = @containerNumber
        OR FROMD = @containerNumber
        OR TOD = @containerNumber
      `)
    return result.recordset
  } catch (error) {
    console.error('Error querying tpr table:', error)
    throw error
  }
}

/**
 * Get all available boxes/containers from tpr table
 * Returns all important columns from tpr table
 * @param {Object} filters - Optional filters (location, status, etc.)
 * @returns {Promise<Array>} Array of all boxes/containers
 */
export async function getAllBoxes(filters = {}) {
  try {
    const pool = await getSqlServerPool()
    let query = `
      SELECT 
        DRVCODE, WONO, BLNO, FECHA, FROMD, FROMCITY, FROMEDO,
        TOD, TOCITY, TOEDO, TIPMOV, STATUS, EL, EQPCODE, DELDATE,
        CSTMER, TIMEARRV, TIMEDEPAR, OPER, USTIMEIN, USTIMEOUT,
        MXMXCSTIN, MXUSCSTIN, MXTIMEOUT, TRUCKID, BLTIME, TARRFROM,
        USRUPDD, USRUPDT, USRADD, USRADDD, USRADDT, INSTRUC1, INSTRUC2,
        RL, AMOUNT, TABLECODE, TRXCODE, SEAL
      FROM tpr WHERE 1=1
    `
    const request = pool.request()

    // Add filters if provided
    if (filters.fromd) {
      query += ' AND FROMD = @fromd'
      request.input('fromd', sql.VarChar, filters.fromd)
    }
    if (filters.tod) {
      query += ' AND TOD = @tod'
      request.input('tod', sql.VarChar, filters.tod)
    }
    if (filters.status) {
      query += ' AND STATUS = @status'
      request.input('status', sql.VarChar, filters.status)
    }

    const result = await request.query(query)
    return result.recordset
  } catch (error) {
    console.error('Error getting all boxes:', error)
    throw error
  }
}

export default { getSqlServerPool, closeSqlServerPool, queryTprTable, getAllBoxes }
