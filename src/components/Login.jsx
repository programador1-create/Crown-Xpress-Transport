import { useState, useEffect } from 'react'
import { Eye, EyeOff, User, Lock, Languages } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { t, language, toggleLanguage } = useLanguage()
  const { login, loading } = useAuth()

  // Add login-page class to body to disable uppercase transform
  useEffect(() => {
    document.body.classList.add('login-page')
    return () => document.body.classList.remove('login-page')
  }, [])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-5 font-sans">
      <div className="w-full max-w-[450px] bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.12)] px-10 py-12 animate-slide-up">
        
        {/* Logo and Titles Section */}
        <div className="text-center mb-10">
          <div className="h-28 w-full flex items-center justify-center mb-6">
            <img 
              src="/crown-logo.png" 
              alt="Crown Logo" 
              className="max-h-full w-auto object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.08)] scale-105" 
            />
          </div>
          <div className="text-xs font-semibold text-crown-gold-dark tracking-[0.15em] uppercase mb-1.5">
            {language === 'es' ? 'Portal de Inspección' : 'Inspection Portal'}
          </div>
          <h1 className="text-3xl font-bold text-crown-navy-dark tracking-tight mb-2">
            {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
          </h1>
          <div className="text-[11px] text-slate-400 font-medium tracking-[0.05em] uppercase">
            {language === 'es' ? 'Lista de 20 puntos' : '20 Point Checklist'}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-crown-navy-dark tracking-[0.08em] uppercase">
              {language === 'es' ? 'Usuario' : 'Username'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <User className="w-[18px] h-[18px] text-crown-gold-dark" />
              </span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-crown-gold focus:ring-4 focus:ring-crown-gold/10 transition-all font-medium"
                placeholder={language === 'es' ? 'Ingrese su usuario' : 'Enter your username'}
                required
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-crown-navy-dark tracking-[0.08em] uppercase">
              {language === 'es' ? 'Contraseña' : 'Password'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <Lock className="w-[18px] h-[18px] text-crown-gold-dark" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-crown-gold focus:ring-4 focus:ring-crown-gold/10 transition-all font-medium"
                placeholder={language === 'es' ? 'Ingrese su contraseña' : 'Enter your password'}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-crown-gold-dark hover:text-crown-navy transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot Link */}
          <div className="flex justify-between items-center text-sm my-1">
            <label className="flex items-center text-slate-500 font-normal normal-case cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="mr-2 cursor-pointer w-4 h-4 accent-crown-gold text-white"
              />
              {language === 'es' ? 'Recuérdame' : 'Remember me'}
            </label>
            <button
              type="button"
              className="text-crown-gold-dark hover:text-crown-navy font-semibold transition-colors text-xs"
              onClick={() => alert(language === 'es' ? 'Comuníquese con el administrador para restablecer su acceso.' : 'Please contact admin to reset your access.')}
            >
              {language === 'es' ? '¿Olvidó su contraseña?' : 'Forgot password?'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-3.5 bg-gradient-to-r from-crown-navy to-crown-navy-dark text-white font-bold rounded-lg hover:shadow-lg hover:shadow-crown-navy/20 hover:-translate-y-[1px] active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none text-sm uppercase tracking-[0.08em]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              <span>{language === 'es' ? 'Iniciar Sesión' : 'Sign In'}</span>
            )}
          </button>

          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="w-full py-3.5 bg-transparent border-2 border-slate-200/80 hover:border-crown-gold hover:bg-slate-50 text-crown-gold-dark hover:text-crown-navy font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2"
          >
            <Languages className="w-4 h-4" />
            <span className="uppercase">{language === 'es' ? 'Switch to English' : 'Cambiar a Español'}</span>
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 mt-10 tracking-[0.03em]">
          © {new Date().getFullYear()} Crown Express Transport - {language === 'es' ? 'Operaciones Seguras' : 'Secure Operations'}
          <div className="mt-1 space-x-2">
            <button type="button" className="hover:text-crown-navy-dark hover:underline">{language === 'es' ? 'Términos' : 'Terms'}</button>
            <span>•</span>
            <button type="button" className="hover:text-crown-navy-dark hover:underline">{language === 'es' ? 'Privacidad' : 'Privacy'}</button>
          </div>
        </div>

      </div>
    </div>
  )
}
