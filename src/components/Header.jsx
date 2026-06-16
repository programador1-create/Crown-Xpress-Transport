import { useState } from 'react'
import { Languages, LogOut, User, Plus, ChevronDown, RotateCcw, RefreshCw, Trash2 } from 'lucide-react'
import Logo from './Logo'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { language, toggleLanguage, t } = useLanguage()
  const { resetInspection, progressPercent } = useInspection()
  const { user, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  const handleNewInspection = () => {
    if (confirm(language === 'es' ? '¿Iniciar una nueva inspección? Se perderán los datos actuales.' : 'Start a new inspection? Current data will be lost.')) {
      resetInspection()
      setShowMenu(false)
    }
  }
  
  const handleClear = () => {
    if (confirm(language === 'es' ? '¿Limpiar todos los datos? Esta acción no se puede deshacer.' : 'Clear all data? This action cannot be undone.')) {
      resetInspection()
      setShowMenu(false)
    }
  }
  
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center">
      <img
        src="/crown-logo.png"
        alt="Crown Xpress"
        className="w-20 h-20 object-contain drop-shadow-sm"
      />
    </div>
        
        <div className="hidden md:flex flex-col items-center px-6">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{t('appTitle')}</div>
          <div className="text-xs text-crown-gold-dark font-bold">{t('formCode')}</div>
          <div className="w-48 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-crown-gold to-crown-navy transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{progressPercent}% {t('completed')}</div>
        </div>

        <div className="flex items-center gap-2">
          {/* User Info */}
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-crown-gold flex items-center justify-center">
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-crown-gold flex items-center justify-center">
                  <User className="w-4 h-4 text-crown-navy" />
                </div>
              )}
            </div>
            <div className="text-sm">
              <div className="font-semibold text-slate-800">{user?.full_name}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role} · {user?.location_name}</div>
            </div>
          </div>

          {/* Language */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-crown-navy/20 hover:border-crown-navy hover:bg-crown-navy/5 transition-colors text-sm font-semibold text-crown-navy"
            aria-label={t('language')}
          >
            <Languages className="w-4 h-4" />
            <span className="uppercase">{language}</span>
          </button>

          {/* New Inspection Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'es' ? 'Nueva Inspección' : 'New Inspection'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                  <button
                    onClick={handleNewInspection}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-emerald-50 flex items-center gap-3 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-slate-700">
                      {language === 'es' ? 'Nueva Inspección' : 'New Inspection'}
                    </span>
                  </button>
                  <button
                    onClick={handleClear}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-rose-50 flex items-center gap-3 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span className="font-medium text-slate-700">
                      {language === 'es' ? 'Limpiar Datos' : 'Clear Data'}
                    </span>
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-slate-700">
                      {language === 'es' ? 'Actualizar Página' : 'Refresh Page'}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      window.history.back()
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-600" />
                    <span className="font-medium text-slate-700">
                      {language === 'es' ? 'Regresar' : 'Go Back'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={() => {
              if (confirm(language === 'es' ? '¿Cerrar sesión?' : 'Sign out?')) {
                logout()
              }
            }}
            className="p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title={language === 'es' ? 'Cerrar sesión' : 'Sign out'}
            aria-label={language === 'es' ? 'Cerrar sesión' : 'Sign out'}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
