import { useState, useEffect, useMemo } from 'react'
import { ChevronRight, ChevronLeft, CheckCircle, Circle, AlertTriangle, MessageSquare, CheckCheck } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { inspectionPoints, INSPECTION_TYPES } from '../data/inspectionPoints'
import InspectionPoint from './InspectionPoint'

export default function StepByStepInspection({ onAllCompleted }) {
  const { t, language } = useLanguage()
  const { points, goodCount, failedCount, completedCount, unitInfo, updateUnitInfo, setPointStatus } = useInspection()
  const [currentStep, setCurrentStep] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [showConfirmAllOk, setShowConfirmAllOk] = useState(false)

  // Filter inspection points based on inspection type
  const applicablePoints = useMemo(() => {
    const inspectionType = unitInfo?.inspectionType || 'LOADED'
    const typeConfig = INSPECTION_TYPES[inspectionType]
    if (!typeConfig) return inspectionPoints
    return inspectionPoints.filter(p => typeConfig.applicablePoints.includes(p.id))
  }, [unitInfo?.inspectionType])

  const totalPoints = applicablePoints.length
  const isLastStep = currentStep === totalPoints - 1
  const isFirstStep = currentStep === 0
  const currentPoint = applicablePoints[currentStep]
  const currentState = currentPoint ? points[currentPoint.id] : null
  
  // Calculate completed count for applicable points only
  const applicableCompletedCount = useMemo(() => {
    return applicablePoints.filter(p => {
      const state = points[p.id]
      return state?.status === 'good' || (state?.status === 'bad' && state?.issueId && state?.photo)
    }).length
  }, [applicablePoints, points])
  
  const allPointsCompleted = applicableCompletedCount === totalPoints

  // Auto-advance to next step when current point is completed
  useEffect(() => {
    const isComplete = currentState?.status === 'good' || 
                     (currentState?.status === 'bad' && currentState?.issueId && currentState?.photo)

    if (isComplete && !isLastStep && !showSummary) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [currentState, isLastStep, showSummary])

  const goToNext = () => {
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const goToPrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex)
    setShowSummary(false)
  }

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
      // Jump to the last point after marking
      setCurrentStep(totalPoints - 1)
      
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
      // Jump to the last point after marking
      setCurrentStep(totalPoints - 1)
    }
  }

  // Check if there are any bad points
  const hasBadPoints = applicablePoints.some(point => points[point.id]?.status === 'bad')

  // Show summary view
  if (showSummary) {
    return (
      <section className="card animate-slide-up">
        <div className="card-header flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-crown-gold" />
            <div>
              <h2 className="font-bold tracking-wide uppercase text-sm">{t('inspectionSummary')}</h2>
              <p className="text-[10px] text-white/60 uppercase tracking-widest">
                {allPointsCompleted 
                  ? (language === 'es' ? 'Todos los puntos completados' : 'All points completed')
                  : (language === 'es' ? `${completedCount} de ${totalPoints} completados` : `${completedCount} of ${totalPoints} completed`)
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="font-bold">{goodCount}</span>
              <span className="text-emerald-300/70">{t('good')}</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-bold">{failedCount}</span>
              <span className="text-rose-300/70">{t('bad')}</span>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          <div className="space-y-2.5 mb-6">
            {applicablePoints.map((point, index) => (
              <InspectionPoint key={point.id} point={point} displayNumber={index + 1} />
            ))}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowSummary(false)}
              className="btn-secondary flex-1"
            >
              {language === 'es' ? 'Continuar editando' : 'Continue editing'}
            </button>
            {allPointsCompleted && onAllCompleted && (
              <button
                onClick={onAllCompleted}
                className="btn-gold flex-1 flex items-center justify-center gap-2"
              >
                {language === 'es' ? 'Continuar a Foto del Sello' : 'Continue to Seal Photo'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="card animate-slide-up">
      <div className="card-header">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                currentState?.status === 'good' 
                  ? 'bg-emerald-600 text-white' 
                  : currentState?.status === 'bad'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-600 text-white'
              }`}>
                {currentPoint.id}
              </div>
              <div>
                <h2 className="font-bold tracking-wide uppercase text-sm">{t('inspectionPoint')}</h2>
                <p className="text-[10px] text-white/60 uppercase tracking-widest">
                  {currentPoint[language]}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-xs text-white/70">
              {currentStep + 1} / {totalPoints}
            </div>
            <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-crown-gold to-crown-gold/80 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalPoints) * 100}%` }}
              />
            </div>
          </div>
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
                      ? `ESTO MARCARÁ LOS ${totalPoints} PUNTOS DE INSPECCIÓN COMO "BUENO". ¿ESTÁ SEGURO?` 
                      : `THIS WILL MARK ALL ${totalPoints} INSPECTION POINTS AS "GOOD". ARE YOU SURE?`)
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

      <div className="card-body">
        {/* Current Point */}
        <div className="mb-6">
          <InspectionPoint point={currentPoint} displayNumber={currentStep + 1} />
        </div>

        {/* Navigation */}
        <div className="space-y-4">
          {/* Step indicators - scrollable on mobile */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1 max-w-full overflow-x-auto py-2 px-1">
              {applicablePoints.map((point, index) => {
                const state = points[point.id]
                const isActive = index === currentStep
                const isCompleted = state?.status === 'good' || (state?.status === 'bad' && state?.issueId && state?.photo)
                
                return (
                  <button
                    key={point.id}
                    onClick={() => goToStep(index)}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-crown-gold text-white ring-2 ring-crown-gold/50 scale-110'
                        : isCompleted
                        ? state?.status === 'good'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                    title={`${language === 'es' ? 'Punto' : 'Point'} ${point.id}: ${point[language]}`}
                  >
                    {point.id}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={goToPrevious}
              disabled={isFirstStep}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-lg transition-all ${
                isFirstStep
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed border-2 border-slate-300'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-2 border-slate-300 shadow-md'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">
                {language === 'es' ? 'Anterior' : 'Previous'}
              </span>
            </button>

            <div className="text-center text-lg font-bold text-slate-700 bg-white px-4 py-2 rounded-xl border-2 border-slate-300 shadow-md">
              {currentStep + 1} / {totalPoints}
            </div>

            <button
              onClick={goToNext}
              disabled={isLastStep}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-lg transition-all ${
                isLastStep
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed border-2 border-slate-300'
                  : 'bg-crown-navy text-white hover:bg-crown-navy/90 border-2 border-crown-navy-dark shadow-lg'
              }`}
            >
              <span className="hidden sm:inline">
                {language === 'es' ? 'Siguiente' : 'Next'}
              </span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick jump buttons */}
        {completedCount > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
            <button
              onClick={() => setShowSummary(true)}
              className="btn-secondary w-full text-sm"
            >
              {language === 'es' ? 'Ver resumen de inspección' : 'View inspection summary'}
            </button>
          </div>
        )}

        {/* Comments section - only shows when all 20 points are completed */}
        {allPointsCompleted && (
          <div className="mt-6 pt-6 border-t-2 border-emerald-200 bg-emerald-50/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-emerald-800">
                {language === 'es' ? 'Comentarios de la Inspección' : 'Inspection Comments'}
              </h3>
              <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                {language === 'es' ? 'Opcional' : 'Optional'}
              </span>
            </div>
            <textarea
              value={unitInfo.notes || ''}
              onChange={e => updateUnitInfo('notes', e.target.value)}
              className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none bg-white"
              rows={3}
              placeholder={language === 'es' ? 'Agregue comentarios adicionales sobre la inspección...' : 'Add additional comments about the inspection...'}
            />
            
            {onAllCompleted && (
              <button
                onClick={onAllCompleted}
                className="btn-gold w-full flex items-center justify-center gap-2 mt-4"
              >
                {language === 'es' ? 'Continuar a Foto del Sello' : 'Continue to Seal Photo'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
