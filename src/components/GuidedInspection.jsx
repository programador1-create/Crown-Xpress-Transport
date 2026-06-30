import { useState, useEffect, useMemo } from 'react'
import { ClipboardCheck, ArrowRight, CheckCircle, Truck } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { getApplicablePoints } from '../data/inspectionPoints'
import UnitInfoEnhanced from './UnitInfoEnhanced'
import EmptyLoads from './EmptyLoads'
import StepByStepInspection from './StepByStepInspection'
import SealPhotoSection from './SealPhotoSection'
import SignatureSection from './SignatureSection'
import SubmitBar from './SubmitBar'
import TruckDiagramVisual from './TruckDiagramVisual'

export default function GuidedInspection() {
  const { t, language } = useLanguage()
  const { unitInfo, points, completedCount, resetInspection } = useInspection()
  const [currentStage, setCurrentStage] = useState('unitInfo') // unitInfo, inspection, seal, signatures
  const [unitInfoValid, setUnitInfoValid] = useState(false)
  const [hasContainer, setHasContainer] = useState(false)
  const [hasSeal, setHasSeal] = useState(false)
  const [hasLock, setHasLock] = useState(false)
  const [unitInfoFlowComplete, setUnitInfoFlowComplete] = useState(false)
  const [showEmptyLoads, setShowEmptyLoads] = useState(false)

  // Get applicable points based on inspection type
  const applicablePoints = useMemo(() => {
    return getApplicablePoints(unitInfo?.inspectionType)
  }, [unitInfo?.inspectionType])

  const totalPoints = applicablePoints.length
  const allPointsCompleted = completedCount === totalPoints

  // Check if unit info is valid
  useEffect(() => {
    // Reset to unitInfo stage when inspection is reset (unitInfo becomes empty)
    if (!unitInfo?.inspectionType && currentStage !== 'unitInfo') {
      setCurrentStage('unitInfo')
      setUnitInfoValid(false)
      setUnitInfoFlowComplete(false)
      return
    }

    // For BOBTAIL: only need driverName (no trailer, no container, no seal)
    if (unitInfo?.inspectionType === 'BOBTAIL') {
      const required = ['driverName']
      const isValid = required.every(field => unitInfo[field] && unitInfo[field].trim() !== '')
      setUnitInfoValid(isValid)
      // Auto-complete flow for BOBBTAIL since there's no trailer info to capture
      if (isValid && !unitInfoFlowComplete) {
        setUnitInfoFlowComplete(true)
      }
      return
    }

    // For FLATBED: need tractorNumber, and trailerNumber (platform number) - driverName and location are optional
    if (unitInfo?.inspectionType === 'FLATBED') {
      const required = ['trailerNumber', 'tractorNumber']
      const isValid = required.every(field => unitInfo[field] && unitInfo[field].trim() !== '')
      setUnitInfoValid(isValid)
      if (isValid && !unitInfoFlowComplete) {
        setUnitInfoFlowComplete(true)
      }
      return
    }

    const required = ['trailerNumber', 'tractorNumber']
    const optional = []

    if (hasSeal) required.push('sealNumber')
    if (hasContainer) required.push('containerNumber')
    if (hasLock) required.push('lockNumber')

    const isValid = required.every(field => unitInfo[field] && unitInfo[field].trim() !== '')
    setUnitInfoValid(isValid)
  }, [unitInfo, hasSeal, hasContainer, hasLock, unitInfoFlowComplete, currentStage])

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
      // Skip seal if not LOADED
      setCurrentStage(needsSealPhoto ? 'seal' : 'signatures')
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
      // Go back to seal if LOADED, otherwise to inspection
      setCurrentStage(needsSealPhoto ? 'seal' : 'inspection')
    }
  }

  // Determine if seal photo stage is needed (only for LOADED)
  const needsSealPhoto = unitInfo?.inspectionType === 'LOADED'
  
  const stages = [
    { id: 'unitInfo', name: language === 'es' ? 'Datos del Camión' : 'Truck Info', icon: ClipboardCheck },
    { id: 'inspection', name: language === 'es' ? 'Inspección' : 'Inspection', icon: CheckCircle },
    ...(needsSealPhoto ? [{ id: 'seal', name: language === 'es' ? 'Foto del Sello' : 'Seal Photo', icon: CheckCircle }] : []),
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
            // Allow access to: current stage, completed stages, inspection if unitInfo valid, seal/signatures if all points completed
            const canAccess = index <= currentStageIndex || 
                              (index === 1 && unitInfoValid) || 
                              (index === 2 && allPointsCompleted) ||
                              (index === 3 && allPointsCompleted)
            
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
            onOpenNbcwModal={() => setShowEmptyLoads(true)}
            onFlowComplete={setUnitInfoFlowComplete}
          />
          {unitInfoValid && unitInfoFlowComplete && (
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
        <div className="space-y-6">
          {/* Truck Diagram Visual */}
          <div className="card">
            <div className="card-header flex items-center gap-3">
              <Truck className="w-5 h-5 text-crown-gold" />
              <h2 className="font-bold tracking-wide uppercase text-sm">
                {language === 'es' ? 'Diagrama del Camión' : 'Truck Diagram'}
              </h2>
            </div>
            <div className="card-body p-4">
              <TruckDiagramVisual compact />
            </div>
          </div>
          
          {/* Step by Step Inspection */}
          <StepByStepInspection onAllCompleted={() => setCurrentStage(needsSealPhoto ? 'seal' : 'signatures')} />
        </div>
      )}

      {currentStage === 'seal' && needsSealPhoto && (
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
          <SubmitBar onSuccess={() => {
            resetInspection()
            setCurrentStage('unitInfo')
          }} />
        </div>
      )}
    </div>
  )
}
