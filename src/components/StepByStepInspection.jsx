import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, CheckCircle, Circle, AlertTriangle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { inspectionPoints } from '../data/inspectionPoints'
import InspectionPoint from './InspectionPoint'

export default function StepByStepInspection() {
  const { t, language } = useLanguage()
  const { points, goodCount, failedCount, completedCount } = useInspection()
  const [currentStep, setCurrentStep] = useState(0)
  const [showSummary, setShowSummary] = useState(false)

  const totalPoints = inspectionPoints.length
  const isLastStep = currentStep === totalPoints - 1
  const isFirstStep = currentStep === 0
  const currentPoint = inspectionPoints[currentStep]
  const currentState = points[currentPoint.id]

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

    // Show summary when all points are completed
    if (completedCount === totalPoints && !showSummary) {
      setShowSummary(true)
    }
  }, [currentState, isLastStep, completedCount, totalPoints, showSummary])

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
                {language === 'es' ? 'Todos los puntos completados' : 'All points completed'}
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
            {inspectionPoints.map(point => (
              <InspectionPoint key={point.id} point={point} />
            ))}
          </div>
          
          <button
            onClick={() => setShowSummary(false)}
            className="btn-secondary w-full"
          >
            {language === 'es' ? 'Continuar editando' : 'Continue editing'}
          </button>
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

      <div className="card-body">
        {/* Current Point */}
        <div className="mb-6">
          <InspectionPoint point={currentPoint} />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={goToPrevious}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isFirstStep
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            {language === 'es' ? 'Anterior' : 'Previous'}
          </button>

          {/* Step indicators */}
          <div className="flex items-center gap-1">
            {inspectionPoints.map((point, index) => {
              const state = points[point.id]
              const isActive = index === currentStep
              const isCompleted = state?.status === 'good' || (state?.status === 'bad' && state?.issueId && state?.photo)
              
              return (
                <button
                  key={point.id}
                  onClick={() => goToStep(index)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-crown-gold text-white ring-2 ring-crown-gold/50'
                      : isCompleted
                      ? state?.status === 'good'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {point.id}
                </button>
              )
            })}
          </div>

          <button
            onClick={goToNext}
            disabled={isLastStep}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isLastStep
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-crown-navy text-white hover:bg-crown-navy/90'
            }`}
          >
            {language === 'es' ? 'Siguiente' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick jump buttons */}
        {completedCount > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button
              onClick={() => setShowSummary(true)}
              className="btn-secondary w-full text-sm"
            >
              {language === 'es' ? 'Ver resumen de inspección' : 'View inspection summary'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
