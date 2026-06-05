import { createContext, useContext, useState, useCallback } from 'react'
import { inspectionPoints } from '../data/inspectionPoints'

const InspectionContext = createContext()

const initialPoints = () => inspectionPoints.reduce((acc, p) => {
  acc[p.id] = { status: null, issueId: null, issueCustomText: null, photo: null }
  return acc
}, {})

export function InspectionProvider({ children }) {
  // Unit info
  const [unitInfo, setUnitInfo] = useState({
    trailerNumber: '',
    sealNumber: '',
    lockNumber: '',
    containerNumber: '',
    driverName: '',
    odometer: '',
    location: '',
    inspectionDate: new Date().toISOString().slice(0, 16),
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
      sealNumber: '',
      lockNumber: '',
      containerNumber: '',
      driverName: '',
      odometer: '',
      location: '',
      inspectionDate: new Date().toISOString().slice(0, 16),
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

  // Computed
  const completedCount = Object.values(points).filter(p => p.status !== null).length
  const failedCount = Object.values(points).filter(p => p.status === 'bad').length
  const goodCount = Object.values(points).filter(p => p.status === 'good').length
  const progressPercent = Math.round((completedCount / inspectionPoints.length) * 100)

  // Validation: all points evaluated, all bad have issueId+photo, guard signed (seal photo and operator signature are handled separately)
  const validation = {
    allPointsEvaluated: completedCount === inspectionPoints.length,
    failuresHaveIssue: Object.values(points).every(p => p.status !== 'bad' || p.issueId),
    failuresHavePhoto: Object.values(points).every(p => p.status !== 'bad' || p.photo),
    hasSealPhoto: !!sealPhoto, // Optional - not required for submission
    guardSigned: !!(guardSignature.signature && guardSignature.name.trim()),
    operatorSigned: !!(operatorSignature.signature && operatorSignature.name.trim()),
  }
  // Operator signature is NOT required here - it will be captured when clicking "Generate PDF"
  const canSubmit = validation.allPointsEvaluated && validation.failuresHaveIssue && validation.failuresHavePhoto && validation.guardSigned

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
