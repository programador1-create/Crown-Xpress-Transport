import { useState } from 'react'
import { Eye, EyeOff, User, Lock, Languages } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { language, toggleLanguage } = useLanguage()
  const { login, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-crown-navy-dark to-crown-navy flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient lights */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-crown-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-crown-navy/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-crown-gold via-crown-gold-dark to-crown-gold" />

          {/* Logo header section with subtle background */}
          <div className="relative bg-gradient-to-b from-slate-50 to-white px-8 pt-10 pb-6 border-b border-slate-100">
            {/* Decorative circles */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-40 h-40 bg-crown-gold/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex flex-col items-center text-center">
              {/* Logo with elegant frame */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-crown-gold/20 to-crown-navy/10 rounded-full blur-xl scale-110" />
                <div className="relative w-32 h-32 flex items-center justify-center bg-white rounded-full shadow-lg ring-1 ring-slate-100">
                  <img src="/crown-logo.png" alt="Crown Xpress" className="w-24 h-24 object-contain" />
                </div>
              </div>
              {/* App name with divider lines */}
              <div className="flex items-center gap-3 w-full max-w-[260px]">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-crown-gold/40" />
                <p className="text-[11px] font-bold tracking-[0.3em] text-crown-gold-dark uppercase whitespace-nowrap">
                  {language === 'es' ? 'Lista de Inspección' : 'Inspection Checklist'}
                </p>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-crown-gold/40" />
              </div>
              <p className="text-[10px] font-semibold tracking-[0.4em] text-slate-400 uppercase mt-1.5">
                {language === 'es' ? '20 Puntos' : '20 Points'}
              </p>
            </div>
          </div>

          <div className="px-8 pt-7 pb-8">
            {/* Sign In header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'es' ? 'Acceda a su cuenta para continuar' : 'Access your account to continue'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {language === 'es' ? 'Usuario' : 'Username'}
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-crown-navy transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-crown-navy focus:ring-4 focus:ring-crown-navy/10 transition-all"
                    placeholder={language === 'es' ? 'Ingrese su usuario' : 'Enter your username'}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  {language === 'es' ? 'Contraseña' : 'Password'}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-crown-navy transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-crown-navy focus:ring-4 focus:ring-crown-navy/10 transition-all"
                    placeholder={language === 'es' ? 'Ingrese su contraseña' : 'Enter your password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full bg-gradient-to-br from-crown-navy to-crown-navy-dark text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-crown-navy/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{language === 'es' ? 'Iniciando...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <span>{language === 'es' ? 'Iniciar Sesión' : 'Sign In'}</span>
                )}
              </button>
            </form>

            {/* Language toggle */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-crown-navy transition-colors"
              >
                <Languages className="w-3.5 h-3.5" />
                {language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Crown Xpress Transport · {language === 'es' ? 'Todos los derechos reservados' : 'All rights reserved'}
        </p>
      </div>
    </div>
  )
}
