import { useState, useEffect } from 'react'
import { BarChart3, Users, Calendar, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'
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
      <div className="card animate-slide-up">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-crown-navy" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card animate-slide-up">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-center">{error}</p>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const { general, byGuard, byDay } = metrics

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-xl font-bold text-crown-navy">
            {language === 'es' ? 'Métricas' : 'Metrics'}
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20 text-sm"
            >
              <option value="day">{language === 'es' ? 'Hoy' : 'Today'}</option>
              <option value="week">{language === 'es' ? 'Esta semana' : 'This week'}</option>
              <option value="month">{language === 'es' ? 'Este mes' : 'This month'}</option>
            </select>
            <button
              onClick={fetchMetrics}
              className="p-2 text-crown-navy hover:bg-slate-100 rounded-lg transition-colors"
              title={language === 'es' ? 'Actualizar' : 'Refresh'}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
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

      {/* Metrics by Guard */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-crown-navy flex items-center gap-2">
            <Users className="w-5 h-5" />
            {language === 'es' ? 'Por Guard' : 'By Guard'}
          </h3>
        </div>
        <div className="card-body">
          {byGuard.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              {language === 'es' ? 'No hay datos disponibles' : 'No data available'}
            </p>
          ) : (
            <div className="space-y-2">
              {byGuard.map((guard, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-crown-navy/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-crown-navy" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{guard.guard_name}</p>
                      <p className="text-xs text-slate-500">{language === 'es' ? 'Guard' : 'Guard'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-800">{guard.total_inspections}</p>
                      <p className="text-xs text-slate-500">{language === 'es' ? 'Total' : 'Total'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">{guard.completed}</p>
                      <p className="text-xs text-slate-500">{language === 'es' ? 'Hechas' : 'Done'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-red-600">{guard.pending}</p>
                      <p className="text-xs text-slate-500">{language === 'es' ? 'Faltaron' : 'Missed'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metrics by Day */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-crown-navy flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {language === 'es' ? 'Por Día (Últimos 7 días)' : 'By Day (Last 7 days)'}
          </h3>
        </div>
        <div className="card-body">
          {byDay.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              {language === 'es' ? 'No hay datos disponibles' : 'No data available'}
            </p>
          ) : (
            <div className="space-y-2">
              {byDay.map((day, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-crown-navy/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-crown-navy" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {new Date(day.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-slate-500">{language === 'es' ? 'Fecha' : 'Date'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-800">{day.total_inspections}</p>
                      <p className="text-xs text-slate-500">{language === 'es' ? 'Total' : 'Total'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">{day.completed}</p>
                      <p className="text-xs text-slate-500">{language === 'es' ? 'Hechas' : 'Done'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-red-600">{day.pending}</p>
                      <p className="text-xs text-slate-500">{language === 'es' ? 'Faltaron' : 'Missed'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
    <div className={`card border-2 ${colorClasses[color]} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-6 h-6" />
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
