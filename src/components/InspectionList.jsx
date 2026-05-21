import { useState } from 'react'
import { ClipboardCheck, CheckCircle2, XCircle, Circle, Filter, Eye } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { inspectionPoints } from '../data/inspectionPoints'
import InspectionPoint from './InspectionPoint'

export default function InspectionList() {
  const { t, language } = useLanguage()
  const { points, goodCount, failedCount, completedCount } = useInspection()
  const [showOnlyProblems, setShowOnlyProblems] = useState(false)
  const pendingCount = inspectionPoints.length - completedCount

  // Filter points based on view mode
  const displayPoints = showOnlyProblems 
    ? inspectionPoints.filter(point => points[point.id]?.status === 'bad')
    : inspectionPoints

  return (
    <section className="card animate-slide-up">
      <div className="card-header flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-5 h-5 text-crown-gold" />
          <div>
            <h2 className="font-bold tracking-wide uppercase text-sm">{t('inspectionTitle')}</h2>
            <p className="text-[10px] text-white/60 uppercase tracking-widest">{t('inspectionSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Stat icon={CheckCircle2} count={goodCount} color="text-emerald-300" label={t('good')} />
          <Stat icon={XCircle} count={failedCount} color="text-rose-300" label={t('bad')} />
          <Stat icon={Circle} count={pendingCount} color="text-slate-300" label={t('pending')} />
          {failedCount > 0 && (
            <button
              onClick={() => setShowOnlyProblems(!showOnlyProblems)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
                showOnlyProblems 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="font-bold text-xs">
                {showOnlyProblems ? (language === 'es' ? 'Todos' : 'All') : (language === 'es' ? 'Problemas' : 'Issues')}
              </span>
              {!showOnlyProblems && <span className="text-[10px]">({failedCount})</span>}
            </button>
          )}
        </div>
      </div>
      <div className="card-body space-y-2.5">
        {showOnlyProblems && failedCount === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {language === 'es' ? 'No hay problemas reportados' : 'No issues reported'}
            </p>
          </div>
        ) : (
          displayPoints.map(point => (
            <InspectionPoint key={point.id} point={point} />
          ))
        )}
      </div>
    </section>
  )
}

function Stat({ icon: Icon, count, color, label }) {
  return (
    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className="font-bold text-white">{count}</span>
      <span className="text-white/70 hidden sm:inline">{label}</span>
    </div>
  )
}
