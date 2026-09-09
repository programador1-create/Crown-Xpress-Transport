import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { InspectionProvider } from './context/InspectionContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <InspectionProvider>
          <App />
        </InspectionProvider>
      </LanguageProvider>
    </AuthProvider>
  </React.StrictMode>,
)

// Registrar Service Worker para PWA (offline)
import { registerSW } from 'virtual:pwa-register'
registerSW({
  onNeedRefresh() {
    console.log('Nueva versión disponible - recarga para actualizar')
  },
  onOfflineReady() {
    console.log('App lista para funcionar offline')
  },
})
