import { Client } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar .env desde la carpeta scripts
dotenv.config({ path: join(__dirname, '.env') })

// Leer archivo JSON desde argumento
const jsonFile = process.argv[2]
if (!jsonFile) {
  console.error('Error: Se requiere archivo JSON como argumento')
  process.exit(1)
}

const jsonData = JSON.parse(readFileSync(jsonFile, 'utf8'))
console.log(`Leidos ${jsonData.length} registros del archivo JSON`)

// Conectar a Neon
const neonClient = new Client(process.env.DATABASE_URL)
await neonClient.connect()
console.log('Conectado a Neon')

// Dropear tabla existente para recrear con schema correcto
await neonClient.query('DROP TABLE IF EXISTS tpr')
console.log('Tabla tpr eliminada')

// Crear tabla con schema correcto
await neonClient.query(`
  CREATE TABLE tpr (
    id SERIAL PRIMARY KEY,
    drvcode VARCHAR(50),
    wono VARCHAR(50),
    blno VARCHAR(50),
    fecha_raw VARCHAR(12),
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
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )
`)
console.log('Tabla tpr creada con schema correcto')

// Insertar datos en lotes
const batchSize = 100
let inserted = 0

for (let i = 0; i < jsonData.length; i += batchSize) {
  const batch = jsonData.slice(i, i + batchSize)
  const values = []
  const params = []
  let paramIndex = 1

  for (const row of batch) {
    const placeholders = Array.from({ length: 26 }, (_, j) => `$${paramIndex + j}`).join(', ')
    values.push(`(${placeholders}, NOW())`)

    params.push(
      row.driver_code || null,
      row.work_order || null,
      row.bill_of_lading || null,
      row.fecha_raw || null,
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
    )
    paramIndex += 26
  }

  const columns = [
    'drvcode', 'wono', 'blno', 'fecha_raw', 'fromd', 'fromcity', 'fromedo',
    'tod', 'tocity', 'toedo', 'tipmov', 'status', 'el', 'eqpcode',
    'deldate', 'cstmer', 'timearrv', 'timedepar', 'oper', 'truckid', 'seal',
    'instruc1', 'instruc2', 'amount', 'tablecode', 'trxcode', 'synced_at'
  ].join(', ')

  const query = `INSERT INTO tpr (${columns}) VALUES ${values.join(', ')}`
  await neonClient.query(query, params)
  inserted += batch.length
  console.log(`Insertados ${inserted} de ${jsonData.length} registros...`)
}

await neonClient.end()
console.log(`Sincronizacion completada: ${inserted} insertados`)
