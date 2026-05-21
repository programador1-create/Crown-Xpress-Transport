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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Deep premium background gradients matching Crown identity */}
      <div className="absolute inset-0 bg-gradient-to-tr from-crown-navy-dark via-slate-900 to-crown-navy" />
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-crown-gold/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-crown-navy/40 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container - Scaled up for premium layout */}
      <div className="w-full max-w-lg relative z-10 my-4">
        {/* White Card - Spacious and high contrast */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/50 overflow-hidden border border-slate-100">
          {/* Top Elegant Accent Strip in Crown Gold */}
          <div className="h-2 bg-gradient-to-r from-crown-gold via-crown-gold-dark to-crown-gold" />

          <div className="px-8 sm:px-12 py-12">
            {/* Header / Logo integration with optimal spacing */}
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-36 h-36 p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center mb-5">
                <img src="/crown-logo.png" alt="Crown Xpress Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-crown-navy-dark tracking-tight">
                {language === 'es' ? 'Portal de Inspección' : 'Inspection Portal'}
              </h1>
              <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-crown-gold-dark uppercase mt-1">
                {language === 'es' ? 'Lista de 20 Puntos' : '20 Point Checklist'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Input - Big and highly touch-accessible */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {language === 'es' ? 'Usuario' : 'Username'}
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-crown-navy transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200/80 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-crown-navy focus:ring-4 focus:ring-crown-navy/5 transition-all font-medium"
                    placeholder={language === 'es' ? 'Ingrese su usuario' : 'Enter username'}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input - Big and highly touch-accessible */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {language === 'es' ? 'Contraseña' : 'Password'}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-crown-navy transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-200/80 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-crown-navy focus:ring-4 focus:ring-crown-navy/5 transition-all font-medium"
                    placeholder={language === 'es' ? 'Ingrese su contraseña' : 'Enter password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 flex items-start gap-3">
                  <span className="w-2 h-2 bg-rose-500 rounded-full mt-1.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button - Heavy premium button with brand color */}
              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full py-4.5 bg-gradient-to-r from-crown-navy to-crown-navy-dark text-white font-bold rounded-xl hover:shadow-xl hover:shadow-crown-navy/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2 mt-8 text-base tracking-wide border-b-4 border-crown-gold"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{language === 'es' ? 'Iniciar Sesión' : 'Sign In'}</span>
                )}
              </button>
            </form>

            {/* Translation Button */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-crown-navy transition-colors py-1 px-3 rounded-lg hover:bg-slate-50"
              >
                <Languages className="w-4 h-4 text-crown-gold-dark" />
                {language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
              </button>
            </div>
          </div>
        </div>

        {/* Brand Copyright Footer */}
        <p className="text-center text-xs tracking-wider text-slate-400 mt-8">
          © {new Date().getFullYear()} Crown Xpress Transport · {language === 'es' ? 'Operaciones Seguras' : 'Secure Operations'}
        </p>
      </div>
    </div>
  )
}
