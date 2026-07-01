import { useState, useEffect } from 'react'
import { BarChart3, Users, Calendar, TrendingUp, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function MetricsView({ yardCode }) {
  const { t, language } = useLanguage()
  const [period, setPeriod] = useState('day')
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ period })
      if (yardCode) params.append('yardCode', yardCode)
      
      const res = await fetch(`/api/metrics?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setMetrics(data)
      } else {
        setError(data.error || 'Error loading metrics')
      }
    } catch (err) {
      setError(err.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [period, yardCode])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-crown-navy" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    )
  }

  if (!metrics) return null

  const { general, byUser, byDay, comparison } = metrics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-crown-navy">
          {language === 'es' ? 'Métricas' : 'Metrics'}
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
          >
            <option value="day">{language === 'es' ? 'Hoy' : 'Today'}</option>
            <option value="week">{language === 'es' ? 'Esta semana' : 'This week'}</option>
            <option value="month">{language === 'es' ? 'Este mes' : 'This month'}</option>
          </select>
          <button
            onClick={fetchMetrics}
            className="p-2 text-crown-navy hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* General Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={BarChart3}
          label={language === 'es' ? 'Total' : 'Total'}
          value={general.total_inspections || 0}
          color="blue"
        />
        <MetricCard
          icon={CheckCircle}
          label={language === 'es' ? 'Completadas' : 'Completed'}
          value={general.completed || 0}
          color="green"
        />
        <MetricCard
          icon={Clock}
          label={language === 'es' ? 'Pendientes' : 'Pending'}
          value={general.pending || 0}
          color="yellow"
        />
        <MetricCard
          icon={AlertCircle}
          label={language === 'es' ? 'Faltaron' : 'Missed'}
          value={general.pending || 0}
          color="red"
        />
      </div>

      {/* Metrics by User */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-crown-navy mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          {language === 'es' ? 'Por Usuario' : 'By User'}
        </h3>
        {byUser.length === 0 ? (
          <p className="text-slate-500 text-center py-4">
            {language === 'es' ? 'No hay datos disponibles' : 'No data available'}
          </p>
        ) : (
          <div className="space-y-3">
            {byUser.map((user, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">{user.full_name || user.username}</p>
                  <p className="text-sm text-slate-500">@{user.username}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-slate-800">{user.total_inspections}</p>
                    <p className="text-xs text-slate-500">{language === 'es' ? 'Total' : 'Total'}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-green-600">{user.completed}</p>
                    <p className="text-xs text-slate-500">{language === 'es' ? 'Hechas' : 'Done'}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-red-600">{user.pending}</p>
                    <p className="text-xs text-slate-500">{language === 'es' ? 'Faltaron' : 'Missed'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metrics by Day */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-crown-navy mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {language === 'es' ? 'Por Día (Últimos 7 días)' : 'By Day (Last 7 days)'}
        </h3>
        {byDay.length === 0 ? (
          <p className="text-slate-500 text-center py-4">
            {language === 'es' ? 'No hay datos disponibles' : 'No data available'}
          </p>
        ) : (
          <div className="space-y-3">
            {byDay.map((day, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-800">
                    {new Date(day.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-slate-800">{day.total_inspections}</p>
                    <p className="text-xs text-slate-500">{language === 'es' ? 'Total' : 'Total'}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-green-600">{day.completed}</p>
                    <p className="text-xs text-slate-500">{language === 'es' ? 'Hechas' : 'Done'}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-red-600">{day.pending}</p>
                    <p className="text-xs text-slate-500">{language === 'es' ? 'Faltaron' : 'Missed'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comparison: Done vs Missed */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-crown-navy mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {language === 'es' ? 'Comparación: Hechas vs Faltaron' : 'Comparison: Done vs Missed'}
        </h3>
        {comparison.length === 0 ? (
          <p className="text-slate-500 text-center py-4">
            {language === 'es' ? 'No hay datos disponibles' : 'No data available'}
          </p>
        ) : (
          <div className="space-y-4">
            {comparison.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-slate-800">
                    {new Date(item.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-slate-500">
                    {language === 'es' ? 'Total:' : 'Total:'} {item.total}
                  </p>
                </div>
                <div className="h-4 bg-slate-200 rounded-full overflow-hidden flex">
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${(item.done / item.total) * 100}%` }}
                  />
                  <div
                    className="bg-red-500 h-full transition-all"
                    style={{ width: `${(item.missed / item.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-green-600">
                    {language === 'es' ? 'Hechas:' : 'Done:'} {item.done} ({item.total > 0 ? Math.round((item.done / item.total) * 100) : 0}%)
                  </span>
                  <span className="text-red-600">
                    {language === 'es' ? 'Faltaron:' : 'Missed:'} {item.missed} ({item.total > 0 ? Math.round((item.missed / item.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  }

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <Icon className="w-6 h-6 mb-2" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm">{label}</p>
    </div>
  )
}
