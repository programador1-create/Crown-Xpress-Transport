import { useState, useEffect } from 'react'
import { Clock, User, FileText, ShieldCheck, CheckCircle2, XCircle, Edit3, Eye, Download, AlertTriangle, RefreshCw } from 'lucide-react'
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
          {language === 'es' ? 'Historial de Acciones' : 'Action History'}
          <span className="text-xs font-normal text-slate-400 ml-auto">
            {audits.length} {language === 'es' ? 'registros' : 'records'}
          </span>
        </h4>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
          
          <div className="space-y-3">
            {audits.map((a, i) => {
              const getActionIcon = () => {
                switch(a.action) {
                  case 'created': return <FileText className="w-3.5 h-3.5" />
                  case 'signed_guard': return <ShieldCheck className="w-3.5 h-3.5" />
                  case 'signed_auditor': 
                  case 'signed_supervisor': return <Edit3 className="w-3.5 h-3.5" />
                  case 'downloaded_pdf': return <Download className="w-3.5 h-3.5" />
                  case 'viewed': return <Eye className="w-3.5 h-3.5" />
                  case 'reconfirmed': return <RefreshCw className="w-3.5 h-3.5" />
                  case 'point_changed': return <AlertTriangle className="w-3.5 h-3.5" />
                  default: return <User className="w-3.5 h-3.5" />
                }
              }
              
              const getActionColor = () => {
                switch(a.action) {
                  case 'created': return 'bg-blue-500 text-white'
                  case 'signed_guard': return 'bg-crown-navy text-white'
                  case 'signed_auditor':
                  case 'signed_supervisor': return 'bg-emerald-500 text-white'
                  case 'downloaded_pdf': return 'bg-purple-500 text-white'
                  case 'reconfirmed': return 'bg-amber-500 text-white'
                  case 'point_changed': return 'bg-rose-500 text-white'
                  default: return 'bg-slate-400 text-white'
                }
              }
              
              const getActionText = () => {
                switch(a.action) {
                  case 'created': return language === 'es' ? 'Creó la inspección' : 'Created inspection'
                  case 'signed_guard': return language === 'es' ? 'Firmó como guardia' : 'Signed as guard'
                  case 'signed_auditor': return language === 'es' ? 'Firmó como auditor' : 'Signed as auditor'
                  case 'signed_supervisor': return language === 'es' ? 'Firmó como supervisor' : 'Signed as supervisor'
                  case 'downloaded_pdf': return language === 'es' ? 'Descargó PDF' : 'Downloaded PDF'
                  case 'viewed': return language === 'es' ? 'Visualizó inspección' : 'Viewed inspection'
                  case 'reconfirmed': return language === 'es' ? 'Reconfirmó inspección' : 'Reconfirmed inspection'
                  case 'point_changed': return language === 'es' ? 'Modificó punto de inspección' : 'Changed inspection point'
                  default: return a.action
                }
              }
              
              const getRoleLabel = () => {
                switch(a.role) {
                  case 'guard': return language === 'es' ? 'Guardia' : 'Guard'
                  case 'auditor': return language === 'es' ? 'Auditor' : 'Auditor'
                  case 'supervisor': return language === 'es' ? 'Supervisor' : 'Supervisor'
                  case 'admin': return language === 'es' ? 'Administrador' : 'Admin'
                  default: return a.role
                }
              }
              
              return (
                <div key={a.id} className="flex items-start gap-3 pl-1 relative">
                  {/* Timeline dot */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-sm ${getActionColor()}`}>
                    {getActionIcon()}
                  </div>
                  
                  <div className="flex-1 min-w-0 bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="font-semibold text-sm text-slate-800 truncate flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {a.user_name || (language === 'es' ? 'Usuario desconocido' : 'Unknown user')}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        a.role === 'guard' ? 'bg-crown-navy/10 text-crown-navy' :
                        a.role === 'supervisor' || a.role === 'auditor' ? 'bg-emerald-100 text-emerald-700' :
                        a.role === 'admin' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {getRoleLabel()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-crown-navy font-medium mb-1">
                      {getActionText()}
                    </div>
                    
                    {a.details && (
                      <div className="text-xs text-slate-500 bg-slate-50 rounded p-2 mt-2">
                        {a.details}
                      </div>
                    )}
                    
                    <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })}
            
            {audits.length === 0 && (
              <div className="text-center text-slate-400 py-6 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {language === 'es' ? 'Sin acciones registradas aún' : 'No actions recorded yet'}
              </div>
            )}
          </div>
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
