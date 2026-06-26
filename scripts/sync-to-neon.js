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

// Crear tabla si no existe
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

// Limpiar tabla existente
await neonClient.query('DELETE FROM tpr')
console.log('Tabla tpr limpiada')

// Insertar datos en lotes
const batchSize = 100
let inserted = 0

for (let i = 0; i < jsonData.length; i += batchSize) {
  const batch = jsonData.slice(i, i + batchSize)
  const values = []
  const params = []
  let paramIndex = 1

  for (const row of batch) {
    const placeholders = Array.from({ length: 28 }, (_, j) => `$${paramIndex + j}`).join(', ')
    values.push(`(${placeholders}, NOW())`)

    params.push(
      row.driver_code || null,
      row.work_order || null,
      row.bill_of_lading || null,
      row.fecha_raw || null,
      null, // date (calculated from fecha_raw if needed)
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
      null, // delivery_date (calculated from deldate_raw if needed)
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
    paramIndex += 28
  }

  const columns = [
    'driver_code', 'work_order', 'bill_of_lading', 'fecha_raw', 'date', 'from_code', 'from_city', 'from_state',
    'to_code', 'to_city', 'to_state', 'movement_type', 'status', 'equipment_type', 'equipment_code',
    'deldate_raw', 'delivery_date', 'customer', 'arrival_time', 'departure_time', 'operator', 'truck_id', 'seal',
    'instructions_1', 'instructions_2', 'amount', 'table_code', 'trx_code', 'synced_at'
  ].join(', ')

  const query = `INSERT INTO tpr (${columns}) VALUES ${values.join(', ')}`
  await neonClient.query(query, params)
  inserted += batch.length
  console.log(`Insertados ${inserted} de ${jsonData.length} registros...`)
}

await neonClient.end()
console.log(`Sincronizacion completada: ${inserted} insertados`)
