import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { inspectionPoints, getApplicablePoints } from '../data/inspectionPoints'

const InspectionContext = createContext()

const initialPoints = () => inspectionPoints.reduce((acc, p) => {
  acc[p.id] = { status: null, issueId: null, issueCustomText: null, photo: null }
  return acc
}, {})

export function InspectionProvider({ children }) {
  // Unit info
  const [unitInfo, setUnitInfo] = useState({
    trailerNumber: '',
    tractorNumber: '',
    sealNumber: '',
    lockNumber: '',
    containerNumber: '',
    driverName: '',
    odometer: '',
    location: '',
    inspectionDate: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' }),
    guardName: '',
    notes: '',
    highSecuritySeal: 'yes',
    sealAffixed: 'yes',
  })

  // 20 inspection points state: { [id]: { status: 'good'|'bad'|null, issueId, photo } }
  const [points, setPoints] = useState(initialPoints)

  // Seal photo
  const [sealPhoto, setSealPhoto] = useState(null)

  // Signatures
  const [guardSignature, setGuardSignature] = useState({ name: '', signature: null, signedAt: null })
  const [auditorSignature, setAuditorSignature] = useState({ name: '', signature: null, signedAt: null })
  const [operatorSignature, setOperatorSignature] = useState({ name: '', signature: null, signedAt: null })

  // Helpers
  const updateUnitInfo = useCallback((field, value) => {
    setUnitInfo(prev => ({ ...prev, [field]: value }))
  }, [])

  const setPointStatus = useCallback((id, status) => {
    setPoints(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        status,
        // Clear issue if changing back to good
        issueId: status === 'good' ? null : prev[id].issueId,
        photo: status === 'good' ? null : prev[id].photo,
      }
    }))
  }, [])

  const setPointIssue = useCallback((id, issueId, customText = null) => {
    setPoints(prev => ({ ...prev, [id]: { ...prev[id], issueId, issueCustomText: customText } }))
  }, [])

  const setPointPhoto = useCallback((id, photo) => {
    setPoints(prev => ({ ...prev, [id]: { ...prev[id], photo } }))
  }, [])

  const resetInspection = useCallback(() => {
    setUnitInfo({
      trailerNumber: '',
      tractorNumber: '',
      sealNumber: '',
      lockNumber: '',
      containerNumber: '',
      driverName: '',
      odometer: '',
      location: '',
      inspectionDate: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' }),
      guardName: '',
      notes: '',
      highSecuritySeal: 'yes',
      sealAffixed: 'yes',
    })
    setPoints(initialPoints())
    setSealPhoto(null)
    setGuardSignature({ name: '', signature: null, signedAt: null })
    setAuditorSignature({ name: '', signature: null, signedAt: null })
    setOperatorSignature({ name: '', signature: null, signedAt: null })
  }, [])

  // Get applicable points based on inspection type
  const applicablePoints = useMemo(() => {
    return getApplicablePoints(unitInfo?.inspectionType)
  }, [unitInfo?.inspectionType])

  const applicablePointIds = useMemo(() => {
    return applicablePoints.map(p => p.id)
  }, [applicablePoints])

  // Computed - only count applicable points for this inspection type
  const completedCount = applicablePointIds.filter(id => points[id]?.status !== null).length
  const failedCount = applicablePointIds.filter(id => points[id]?.status === 'bad').length
  const goodCount = applicablePointIds.filter(id => points[id]?.status === 'good').length
  const progressPercent = applicablePoints.length > 0 ? Math.round((completedCount / applicablePoints.length) * 100) : 0

  // Check if seal photo is required: only when LOADED + has seal number (not lock) + not FLATBED
  const hasSealNumber = !!(unitInfo.sealNumber && unitInfo.sealNumber.trim())
  const hasLockNumber = !!(unitInfo.lockNumber && unitInfo.lockNumber.trim())
  const isFlatbed = unitInfo.trailerType === 'FLATBED'
  const isLoaded = unitInfo.inspectionType === 'LOADED'
  const sealPhotoRequired = isLoaded && hasSealNumber && !hasLockNumber && !isFlatbed

  // Validation: all applicable points evaluated, all bad have issueId+photo, guard signed
  const validation = {
    allPointsEvaluated: completedCount === applicablePoints.length,
    failuresHaveIssue: applicablePointIds.every(id => points[id]?.status !== 'bad' || points[id]?.issueId),
    failuresHavePhoto: applicablePointIds.every(id => points[id]?.status !== 'bad' || points[id]?.photo),
    hasSealPhoto: !!sealPhoto,
    sealPhotoRequired: sealPhotoRequired,
    sealPhotoValid: !sealPhotoRequired || !!sealPhoto, // Valid if not required OR has photo
    guardSigned: !!(guardSignature.signature && guardSignature.name.trim()),
    operatorSigned: !!(operatorSignature.signature && operatorSignature.name.trim()),
  }
  // Operator signature is NOT required here - it will be captured when clicking "Generate PDF"
  // Seal photo is required when LOADED + has seal (not lock) + not FLATBED
  const canSubmit = validation.allPointsEvaluated && validation.failuresHaveIssue && validation.failuresHavePhoto && validation.guardSigned && validation.sealPhotoValid

  return (
    <InspectionContext.Provider value={{
      unitInfo, updateUnitInfo,
      points, setPointStatus, setPointIssue, setPointPhoto,
      sealPhoto, setSealPhoto,
      guardSignature, setGuardSignature,
      auditorSignature, setAuditorSignature,
      operatorSignature, setOperatorSignature,
      resetInspection,
      completedCount, failedCount, goodCount, progressPercent,
      validation, canSubmit,
    }}>
      {children}
    </InspectionContext.Provider>
  )
}

export function useInspection() {
  const ctx = useContext(InspectionContext)
  if (!ctx) throw new Error('useInspection must be used within InspectionProvider')
  return ctx
}
