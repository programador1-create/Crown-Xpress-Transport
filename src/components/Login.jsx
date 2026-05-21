import { useState } from 'react'
import { Shield, Eye, EyeOff, User, Lock } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { t, language } = useLanguage()
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
      {/* Decorative blur shapes */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-crown-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-crown-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden backdrop-blur">
          {/* Header with Logo */}
          <div className="bg-gradient-to-br from-crown-navy via-crown-navy-dark to-slate-900 px-8 pt-8 pb-10 text-center relative">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, #c9a961 0%, transparent 50%), radial-gradient(circle at 80% 80%, #c9a961 0%, transparent 50%)'
            }} />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-28 h-28 mb-3 bg-white rounded-2xl shadow-xl p-2">
                <img src="/crown-logo.png" alt="Crown Xpress" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-white text-2xl font-display font-bold tracking-wide">CROWN XPRESS</h1>
              <p className="text-crown-gold text-xs font-semibold tracking-widest uppercase mt-0.5">
                {t('inspectionTitle')}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 pt-6 pb-8">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-slate-800">
                {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {language === 'es' ? 'Ingrese sus credenciales' : 'Enter your credentials'}
              </p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {language === 'es' ? 'Usuario' : 'Username'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
                  placeholder={language === 'es' ? 'Ej: guardia01' : 'Ex: guardia01'}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {language === 'es' ? 'Contraseña' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
                  placeholder={language === 'es' ? '••••' : '••••'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-crown-navy to-crown-navy-dark text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-crown-navy/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-crown-gold/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {language === 'es' ? 'Iniciando...' : 'Signing in...'}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Demo Users */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-2">
              {language === 'es' ? 'Usuarios de demostración:' : 'Demo users:'}
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">guardia01 / 1234</span>
                <span className="text-crown-navy font-medium">Guardia</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">inspector01 / 1234</span>
                <span className="text-crown-navy font-medium">Inspector</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">auditor01 / 1234</span>
                <span className="text-crown-gold font-medium">Auditor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">admin / admin</span>
                <span className="text-crown-gold font-medium">Admin</span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
