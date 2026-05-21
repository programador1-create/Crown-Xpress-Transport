import { Languages, RotateCcw, LogOut, User } from 'lucide-react'
import Logo from './Logo'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { language, toggleLanguage, t } = useLanguage()
  const { resetInspection, progressPercent } = useInspection()
  const { user, logout } = useAuth()

  const handleReset = () => {
    if (confirm(language === 'es' ? '¿Iniciar una nueva inspección? Se perderán los datos actuales.' : 'Start a new inspection? Current data will be lost.')) {
      resetInspection()
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <Logo size="md" />
        
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
            <div className="w-8 h-8 bg-crown-gold rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-crown-navy" />
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

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title={t('newInspection')}
            aria-label={t('newInspection')}
          >
            <RotateCcw className="w-5 h-5" />
          </button>

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
