/**
 * Capa de almacenamiento offline usando IndexedDB.
 * Guarda:
 *  - Movimientos TPR precargados (para inspeccionar sin internet)
 *  - Inspecciones creadas offline (cola de sincronización)
 *  - Inspecciones ya sincronizadas (cache local para historial)
 */

const DB_NAME = 'crown-xpress-offline'
const DB_VERSION = 1

// Stores (tablas) en IndexedDB
const STORE_TPR = 'tpr_movements'        // Movimientos TPR precargados
const STORE_PENDING = 'pending_inspections' // Inspecciones creadas offline (cola de sync)
const STORE_CACHE = 'inspection_cache'    // Cache de inspecciones ya sincronizadas

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_TPR)) {
        db.createObjectStore(STORE_TPR, { keyPath: 'sql_id' })
      }
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        const store = db.createObjectStore(STORE_PENDING, { keyPath: 'localId', autoIncrement: true })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'id' })
      }
    }
  })
  return dbPromise
}

function tx(db, store, mode = 'readonly') {
  return db.transaction(store, mode).objectStore(store)
}

function promisifyReq(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ============================================================
// TPR Movements (precargados para inspección offline)
// ============================================================

export async function saveTprMovements(movements) {
  const db = await openDB()
  const store = tx(db, STORE_TPR, 'readwrite')
  // Limpiar y reemplazar
  await promisifyReq(store.clear())
  for (const m of movements) {
    if (m.sql_id) store.put(m)
  }
  return movements.length
}

export async function getTprMovements() {
  const db = await openDB()
  const store = tx(db, STORE_TPR)
  return promisifyReq(store.getAll())
}

export async function clearTprMovements() {
  const db = await openDB()
  return promisifyReq(tx(db, STORE_TPR, 'readwrite').clear())
}

// Marcar un movimiento TPR como inspeccionado localmente (para no duplicar)
const INSPECTED_KEY = 'crown-inspected-sql-ids'

export async function markTprInspected(sqlIds) {
  if (!sqlIds || sqlIds.length === 0) return
  const existing = JSON.parse(localStorage.getItem(INSPECTED_KEY) || '[]')
  const set = new Set(existing)
  for (const id of sqlIds) {
    if (id) set.add(String(id))
  }
  localStorage.setItem(INSPECTED_KEY, JSON.stringify([...set]))
}

export async function getInspectedSqlIds() {
  return new Set(JSON.parse(localStorage.getItem(INSPECTED_KEY) || '[]'))
}

export async function clearInspectedSqlIds() {
  localStorage.removeItem(INSPECTED_KEY)
}

// ============================================================
// Pending Inspections (cola de sincronización)
// ============================================================

export async function addPendingInspection(inspection) {
  const db = await openDB()
  const store = tx(db, STORE_PENDING, 'readwrite')
  const record = {
    ...inspection,
    status: 'pending', // pending | syncing | failed
    createdAt: new Date().toISOString(),
    attempts: 0,
  }
  const result = await promisifyReq(store.add(record))
  // Notificar que se agrego a la cola
  window.dispatchEvent(new CustomEvent('pending-inspection-added'))
  return result // localId
}

export async function getPendingInspections() {
  const db = await openDB()
  const store = tx(db, STORE_PENDING)
  const all = await promisifyReq(store.getAll())
  return all.filter(r => r.status === 'pending' || r.status === 'failed')
}

export async function getPendingCount() {
  const db = await openDB()
  const store = tx(db, STORE_PENDING)
  const all = await promisifyReq(store.getAll())
  return all.filter(r => r.status !== 'synced').length
}

export async function markPendingSyncing(localId) {
  const db = await openDB()
  const store = tx(db, STORE_PENDING, 'readwrite')
  const record = await promisifyReq(store.get(localId))
  if (record) {
    record.status = 'syncing'
    record.attempts = (record.attempts || 0) + 1
    await promisifyReq(store.put(record))
  }
}

export async function markPendingSynced(localId, serverId) {
  const db = await openDB()
  const store = tx(db, STORE_PENDING, 'readwrite')
  const record = await promisifyReq(store.get(localId))
  if (record) {
    record.status = 'synced'
    record.serverId = serverId
    record.syncedAt = new Date().toISOString()
    await promisifyReq(store.put(record))
  }
}

export async function markPendingFailed(localId, error) {
  const db = await openDB()
  const store = tx(db, STORE_PENDING, 'readwrite')
  const record = await promisifyReq(store.get(localId))
  if (record) {
    record.status = 'failed'
    record.lastError = error
    await promisifyReq(store.put(record))
  }
}

export async function clearSyncedPending() {
  const db = await openDB()
  const store = tx(db, STORE_PENDING, 'readwrite')
  const all = await promisifyReq(store.getAll())
  for (const r of all) {
    if (r.status === 'synced') store.delete(r.localId)
  }
}

// ============================================================
// Inspection Cache (historial local)
// ============================================================

export async function cacheInspections(inspections) {
  const db = await openDB()
  const store = tx(db, STORE_CACHE, 'readwrite')
  for (const insp of inspections) {
    if (insp.id) store.put(insp)
  }
}

export async function getCachedInspections() {
  const db = await openDB()
  const store = tx(db, STORE_CACHE)
  return promisifyReq(store.getAll())
}

export async function clearCache() {
  const db = await openDB()
  return promisifyReq(tx(db, STORE_CACHE, 'readwrite').clear())
}

// ============================================================
// Utilidades
// ============================================================

export function isOnline() {
  return navigator.onLine
}

export function onConnectionChange(callback) {
  window.addEventListener('online', () => callback(true))
  window.addEventListener('offline', () => callback(false))
}
