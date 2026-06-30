import { useState, useMemo } from 'react'
import { ClipboardCheck, CheckCircle2, XCircle, Circle, Filter, Eye, CheckCheck } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { inspectionPoints, getApplicablePoints } from '../data/inspectionPoints'
import InspectionPoint from './InspectionPoint'

export default function InspectionList() {
  const { t, language } = useLanguage()
  const { points, goodCount, failedCount, completedCount, setPointStatus, unitInfo } = useInspection()
  const [showOnlyProblems, setShowOnlyProblems] = useState(false)
  const [showConfirmAllOk, setShowConfirmAllOk] = useState(false)
  
  // Get applicable points based on inspection type
  const applicablePoints = useMemo(() => {
    return getApplicablePoints(unitInfo?.inspectionType)
  }, [unitInfo?.inspectionType])
  
  const pendingCount = applicablePoints.length - completedCount

  // Filter points based on view mode - only show applicable points
  const displayPoints = showOnlyProblems 
    ? applicablePoints.filter(point => points[point.id]?.status === 'bad')
    : applicablePoints

  // Mark all applicable points as good, or mark remaining as good if some are bad
  const handleMarkAllGood = () => {
    const badPoints = applicablePoints.filter(point => points[point.id]?.status === 'bad')
    
    if (badPoints.length > 0) {
      // Mark only the non-bad points as good
      const goodPoints = applicablePoints.filter(point => points[point.id]?.status !== 'bad')
      goodPoints.forEach(point => {
        setPointStatus(point.id, 'good')
      })
      
      // Show confirmation with details
      const badPointNames = badPoints.map(p => p[language] || p.es || p.en || p.id).join(', ')
      const goodPointNames = goodPoints.map(p => p[language] || p.es || p.en || p.id).join(', ')
      
      // Close modal immediately
      setShowConfirmAllOk(false)
      
      // Show alert after modal is closed and state has updated
      setTimeout(() => {
        alert(
          language === 'es' 
            ? `✅ Se marcaron como BUENOS:\n${goodPointNames}\n\n❌ Se mantienen como MALOS:\n${badPointNames}`
            : `✅ Marked as GOOD:\n${goodPointNames}\n\n❌ Kept as BAD:\n${badPointNames}`
        )
      }, 300)
    } else {
      // Mark all points as good (original behavior)
      applicablePoints.forEach(point => {
        setPointStatus(point.id, 'good')
      })
      
      // Close modal immediately
      setShowConfirmAllOk(false)
    }
  }

  // Check if there are any bad points
  const hasBadPoints = applicablePoints.some(point => points[point.id]?.status === 'bad')

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
      
      {/* TODO OK Button */}
      <div className="px-6 py-4 border-b-2 border-slate-200 bg-gradient-to-r from-emerald-100 to-white">
        <button
          onClick={() => setShowConfirmAllOk(true)}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] border-2 border-emerald-700"
        >
          <CheckCheck className="w-6 h-6" />
          {hasBadPoints 
            ? (language === 'es' ? 'MARCAR RESTO EN BUENO' : 'MARK REST AS GOOD')
            : (language === 'es' ? 'MARCAR TODO COMO BUENO' : 'MARK ALL AS GOOD')
          }
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmAllOk && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border-2 border-slate-200">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 text-white text-center">
              <CheckCheck className="w-12 h-12 mx-auto mb-3" />
              <h3 className="font-bold text-xl">
                {hasBadPoints 
                  ? (language === 'es' ? '¿MARCAR RESTO EN BUENO?' : 'MARK REST AS GOOD?')
                  : (language === 'es' ? '¿MARCAR TODO COMO BUENO?' : 'MARK ALL AS GOOD?')
                }
              </h3>
            </div>
            <div className="p-6">
              <p className="text-center text-slate-700 text-lg mb-6">
                {hasBadPoints 
                  ? (language === 'es' 
                      ? `ESTO MARCARÁ SOLO LOS PUNTOS NO MARCADOS COMO "MALO" COMO "BUENO". ¿ESTÁ SEGURO?` 
                      : `THIS WILL MARK ONLY POINTS NOT MARKED AS "BAD" AS "GOOD". ARE YOU SURE?`)
                  : (language === 'es' 
                      ? `ESTO MARCARÁ LOS ${applicablePoints.length} PUNTOS DE INSPECCIÓN COMO "BUENO". ¿ESTÁ SEGURO?` 
                      : `THIS WILL MARK ALL ${applicablePoints.length} INSPECTION POINTS AS "GOOD". ARE YOU SURE?`)
                }
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmAllOk(false)}
                  className="flex-1 py-4 px-5 border-4 border-slate-300 rounded-xl text-slate-700 font-bold text-lg hover:bg-slate-100 transition"
                >
                  {language === 'es' ? 'CANCELAR' : 'CANCEL'}
                </button>
                <button
                  onClick={handleMarkAllGood}
                  className="flex-1 py-4 px-5 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition flex items-center justify-center gap-3 border-2 border-emerald-700"
                >
                  <CheckCheck className="w-5 h-5" />
                  {language === 'es' ? 'SÍ, CONFIRMAR' : 'YES, CONFIRM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card-body space-y-2.5">
        {showOnlyProblems && failedCount === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {language === 'es' ? 'No hay problemas reportados' : 'No issues reported'}
            </p>
          </div>
        ) : (
          displayPoints.map((point, index) => (
            <InspectionPoint key={point.id} point={point} displayNumber={index + 1} />
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
