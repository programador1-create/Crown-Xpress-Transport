import { ClipboardCheck, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { inspectionPoints } from '../data/inspectionPoints'
import InspectionPoint from './InspectionPoint'

export default function InspectionList() {
  const { t } = useLanguage()
  const { goodCount, failedCount, completedCount } = useInspection()
  const pendingCount = inspectionPoints.length - completedCount

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
        </div>
      </div>
      <div className="card-body space-y-2.5">
        {inspectionPoints.map(point => (
          <InspectionPoint key={point.id} point={point} />
        ))}
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
