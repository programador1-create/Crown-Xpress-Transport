import { useState, useEffect } from 'react'
import { ClipboardCheck, ArrowRight, CheckCircle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import UnitInfoEnhanced from './UnitInfoEnhanced'
import StepByStepInspection from './StepByStepInspection'
import SealPhotoSection from './SealPhotoSection'
import SignatureSection from './SignatureSection'

export default function GuidedInspection() {
  const { t, language } = useLanguage()
  const { unitInfo, points, completedCount } = useInspection()
  const [currentStage, setCurrentStage] = useState('unitInfo') // unitInfo, inspection, seal, signatures
  const [unitInfoValid, setUnitInfoValid] = useState(false)
  const [hasContainer, setHasContainer] = useState(false)
  const [hasSeal, setHasSeal] = useState(true)
  const [hasLock, setHasLock] = useState(false)

  const totalPoints = 20
  const allPointsCompleted = completedCount === totalPoints

  // Check if unit info is valid
  useEffect(() => {
    const required = ['trailerNumber', 'driverName', 'location']
    const optional = []
    
    if (hasSeal) required.push('sealNumber')
    if (hasContainer) required.push('containerNumber')
    if (hasLock) required.push('lockNumber')
    
    const isValid = required.every(field => unitInfo[field] && unitInfo[field].trim() !== '')
    setUnitInfoValid(isValid)
  }, [unitInfo, hasSeal, hasContainer, hasLock])

  // Auto-advance stages
  useEffect(() => {
    if (currentStage === 'unitInfo' && unitInfoValid) {
      // Don't auto-advance, let user click continue
    }
  }, [unitInfoValid, currentStage])

  const goToNextStage = () => {
    if (currentStage === 'unitInfo' && unitInfoValid) {
      setCurrentStage('inspection')
    } else if (currentStage === 'inspection' && allPointsCompleted) {
      setCurrentStage('seal')
    } else if (currentStage === 'seal') {
      setCurrentStage('signatures')
    }
  }

  const goToPreviousStage = () => {
    if (currentStage === 'inspection') {
      setCurrentStage('unitInfo')
    } else if (currentStage === 'seal') {
      setCurrentStage('inspection')
    } else if (currentStage === 'signatures') {
      setCurrentStage('seal')
    }
  }

  const stages = [
    { id: 'unitInfo', name: language === 'es' ? 'Datos del Camión' : 'Truck Info', icon: ClipboardCheck },
    { id: 'inspection', name: language === 'es' ? 'Inspección' : 'Inspection', icon: CheckCircle },
    { id: 'seal', name: language === 'es' ? 'Foto del Sello' : 'Seal Photo', icon: CheckCircle },
    { id: 'signatures', name: language === 'es' ? 'Firmas' : 'Signatures', icon: CheckCircle }
  ]

  const currentStageIndex = stages.findIndex(s => s.id === currentStage)

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700 text-sm">
            {language === 'es' ? 'Progreso de Inspección' : 'Inspection Progress'}
          </h3>
          <div className="text-xs text-slate-500">
            {currentStageIndex + 1} / {stages.length}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {stages.map((stage, index) => {
            const Icon = stage.icon
            const isActive = stage.id === currentStage
            const isCompleted = index < currentStageIndex
            const canAccess = index <= currentStageIndex || (index === 1 && unitInfoValid)
            
            return (
              <div key={stage.id} className="flex items-center flex-1">
                <button
                  onClick={() => canAccess && setCurrentStage(stage.id)}
                  disabled={!canAccess}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full ${
                    isActive
                      ? 'bg-crown-navy text-white'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : canAccess
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{stage.name}</span>
                </button>
                {index < stages.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-400 mx-1" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stage content */}
      {currentStage === 'unitInfo' && (
        <div>
          <UnitInfoEnhanced 
            onContainerChange={setHasContainer}
            onSealChange={setHasSeal}
            onLockChange={setHasLock}
          />
          {unitInfoValid && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={goToNextStage}
                className="btn-gold flex items-center gap-2"
              >
                {language === 'es' ? 'Comenzar Inspección' : 'Start Inspection'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {currentStage === 'inspection' && (
        <div>
          <StepByStepInspection />
        </div>
      )}

      {currentStage === 'seal' && (
        <div>
          <SealPhotoSection />
          <div className="mt-4 flex justify-between">
            <button
              onClick={goToPreviousStage}
              className="btn-secondary"
            >
              {language === 'es' ? 'Anterior' : 'Previous'}
            </button>
            <button
              onClick={goToNextStage}
              className="btn-gold flex items-center gap-2"
            >
              {language === 'es' ? 'Continuar a Firmas' : 'Continue to Signatures'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {currentStage === 'signatures' && (
        <div>
          <SignatureSection />
          <div className="mt-4 flex justify-between">
            <button
              onClick={goToPreviousStage}
              className="btn-secondary"
            >
              {language === 'es' ? 'Anterior' : 'Previous'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
