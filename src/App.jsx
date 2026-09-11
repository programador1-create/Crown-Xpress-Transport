import { useEffect } from 'react'
import Header from './components/Header'
import Router from './components/Router'
import Login from './components/Login'
import OfflineIndicator from './components/OfflineIndicator'
import { useAuth } from './context/AuthContext'
import { initSyncManager } from './utils/syncManager'
import { clearTprMovements, clearCache, clearInspectedSqlIds } from './utils/offlineDB'

// Modo offline solo activo en preproduccion
const OFFLINE_ENABLED = import.meta.env.VITE_OFFLINE_MODE === 'true'

export default function App() {
  const { user, loading } = useAuth()

  // Inicializar sync manager al cargar la app (solo si offline está activo)
  useEffect(() => {
    if (OFFLINE_ENABLED) {
      initSyncManager()
    } else {
      // Limpiar cache offline en produccion (no se usa)
      clearTprMovements()
      clearCache()
      clearInspectedSqlIds()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-crown-navy via-crown-navy/90 to-crown-gold/20 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen flex flex-col pb-12">
      <Header />
      <Router />
      {OFFLINE_ENABLED && <OfflineIndicator />}
    </div>
  )
}
