import { useState, useEffect } from 'react'
import { Clock, User, FileText, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { getInspection } from '../utils/api'

export default function AuditTrail({ inspectionId, className = '' }) {
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!inspectionId) return
    setLoading(true)
    setError(null)
    getInspection(inspectionId)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [inspectionId])

  if (!inspectionId) {
    return (
      <div className={`text-center text-slate-400 py-8 ${className}`}>
        <Clock className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">{language === 'es' ? 'Seleccione una inspección' : 'Select an inspection'}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`text-center text-slate-400 py-8 ${className}`}>
        <div className="animate-spin w-6 h-6 border-2 border-crown-navy/30 border-t-crown-navy rounded-full mx-auto mb-2" />
        <p className="text-sm">{language === 'es' ? 'Cargando...' : 'Loading...'}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center text-rose-600 py-8 ${className}`}>
        <XCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  const { inspection, points, audits } = data

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-crown-navy" />
        <div>
          <h3 className="font-bold text-slate-800">{inspection.trailer_number || '—'}</h3>
          <p className="text-xs text-slate-500">
            {new Date(inspection.created_at).toLocaleString()} · {language === 'es' ? 'ID' : 'ID'} {inspection.id}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-emerald-50 rounded-lg p-2">
          <div className="text-lg font-bold text-emerald-700">{inspection.total_good}</div>
          <div className="text-xs text-emerald-600">{t('good')}</div>
        </div>
        <div className="bg-rose-50 rounded-lg p-2">
          <div className="text-lg font-bold text-rose-700">{inspection.total_bad}</div>
          <div className="text-xs text-rose-600">{t('bad')}</div>
        </div>
        <div className="bg-slate-100 rounded-lg p-2">
          <div className="text-lg font-bold text-slate-700">{inspection.total_pending}</div>
          <div className="text-xs text-slate-600">{t('pending')}</div>
        </div>
      </div>

      {/* Audit Trail */}
      <div>
        <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {language === 'es' ? 'Historial de acciones' : 'Action History'}
        </h4>
        <div className="space-y-2">
          {audits.map((a, i) => (
            <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                a.role === 'guard' ? 'bg-crown-navy text-white' :
                a.role === 'auditor' ? 'bg-crown-gold text-white' :
                'bg-slate-200 text-slate-600'
              }`}>
                {a.role === 'guard' ? <ShieldCheck className="w-4 h-4" /> :
                 a.role === 'auditor' ? <User className="w-4 h-4" /> :
                 <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-800 truncate">{a.user_name}</div>
                <div className="text-xs text-slate-500 capitalize">{a.role}</div>
                <div className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</div>
                <div className="text-xs text-crown-navy font-medium mt-0.5">
                  {a.action === 'created' ? (language === 'es' ? 'Creó la inspección' : 'Created inspection') :
                   a.action === 'signed_guard' ? (language === 'es' ? 'Firmó como guardia' : 'Signed as guard') :
                   a.action === 'signed_auditor' ? (language === 'es' ? 'Firmó como auditor' : 'Signed as auditor') :
                   a.action === 'downloaded_pdf' ? (language === 'es' ? 'Descargó PDF' : 'Downloaded PDF') :
                   a.action}
                </div>
              </div>
            </div>
          ))}
          {audits.length === 0 && (
            <div className="text-center text-slate-400 py-4 text-sm">
              {language === 'es' ? 'Sin acciones registradas' : 'No actions recorded'}
            </div>
          )}
        </div>
      </div>

      {/* Points with failures */}
      {points.some(p => p.status === 'bad') && (
        <div>
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600" />
            {language === 'es' ? 'Puntos con fallas' : 'Failed Points'}
          </h4>
          <div className="space-y-2">
            {points.filter(p => p.status === 'bad').map(p => (
              <div key={p.point_number} className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-100">
                <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
                  {p.point_number}
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-medium text-rose-800">{p.issue_text}</div>
                  {p.has_photo && <span className="text-rose-600">📷 {language === 'es' ? 'con foto' : 'photo'}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
