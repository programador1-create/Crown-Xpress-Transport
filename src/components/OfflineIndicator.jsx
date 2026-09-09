import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, CloudUpload, CheckCircle, AlertTriangle } from 'lucide-react'
import { isOnline, getPendingCount, onConnectionChange } from '../utils/offlineDB'
import { syncPendingInspections, onSyncStatusChange } from '../utils/syncManager'

/**
 * Indicador offline: muestra estado de conexión y cola de sincronización.
 * Se renderiza fijo en la parte inferior de la pantalla.
 */
export default function OfflineIndicator() {
  const [online, setOnline] = useState(isOnline())
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    // Listener de conexión
    const unsubConn = onConnectionChange((isOn) => {
      setOnline(isOn)
      if (isOn) getPendingCount().then(setPendingCount)
    })
    // Listener de sync
    const unsubSync = onSyncStatusChange(({ syncing, pending }) => {
      setSyncing(syncing)
      setPendingCount(pending)
    })
    // Conteo inicial
    getPendingCount().then(setPendingCount)
    return () => { unsubConn(); unsubSync() }
  }, [])

  // No mostrar nada si hay internet y no hay pendientes
  if (online && pendingCount === 0 && !syncing) return null

  const handleSync = async () => {
    await syncPendingInspections()
    setPendingCount(await getPendingCount())
  }

  return (
    <>
      {/* Barra fija inferior */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 px-4 py-2 shadow-lg ${
          online ? 'bg-amber-500' : 'bg-rose-600'
        } text-white`}
        onClick={() => setShowDetail(!showDetail)}
        role="button"
        aria-label="Estado de conexión"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm font-medium">
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sincronizando...
              </>
            ) : online ? (
              <>
                <CloudUpload className="w-4 h-4" />
                {pendingCount} inspección{pendingCount !== 1 ? 'es' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de sync
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                Sin conexión · {pendingCount} guardada{pendingCount !== 1 ? 's' : ''} localmente
              </>
            )}
          </div>
          {online && pendingCount > 0 && !syncing && (
            <button
              onClick={(e) => { e.stopPropagation(); handleSync() }}
              className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-xs font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Sincronizar ahora
            </button>
          )}
        </div>
      </div>

      {/* Panel de detalle */}
      {showDetail && (
        <div className="fixed bottom-12 left-4 right-4 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm">Estado de sincronización</h3>
            <button onClick={() => setShowDetail(false)} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {online ? (
                <><Wifi className="w-4 h-4 text-emerald-500" /> <span className="text-slate-700">Conectado a internet</span></>
              ) : (
                <><WifiOff className="w-4 h-4 text-rose-500" /> <span className="text-slate-700">Sin conexión a internet</span></>
              )}
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 ? (
                <><AlertTriangle className="w-4 h-4 text-amber-500" /> <span className="text-slate-700">{pendingCount} inspección(es) esperando sincronizar</span></>
              ) : (
                <><CheckCircle className="w-4 h-4 text-emerald-500" /> <span className="text-slate-700">Todo sincronizado</span></>
              )}
            </div>
            {online && pendingCount > 0 && (
              <button
                onClick={handleSync}
                className="w-full mt-2 px-4 py-2 bg-crown-navy text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-crown-navy/90"
              >
                <CloudUpload className="w-4 h-4" />
                Sincronizar ahora
              </button>
            )}
            {!online && (
              <p className="text-xs text-slate-500 mt-2">
                Las inspecciones se guardan en la tablet. Cuando se recupere la conexión,
                se subirán automáticamente.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
