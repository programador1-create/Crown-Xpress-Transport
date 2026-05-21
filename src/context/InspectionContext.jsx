import { createContext, useContext, useState, useCallback } from 'react'
import { inspectionPoints } from '../data/inspectionPoints'

const InspectionContext = createContext()

const initialPoints = () => inspectionPoints.reduce((acc, p) => {
  acc[p.id] = { status: null, issueId: null, photo: null }
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

  const setPointIssue = useCallback((id, issueId) => {
    setPoints(prev => ({ ...prev, [id]: { ...prev[id], issueId } }))
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
  }, [])

  // Computed
  const completedCount = Object.values(points).filter(p => p.status !== null).length
  const failedCount = Object.values(points).filter(p => p.status === 'bad').length
  const goodCount = Object.values(points).filter(p => p.status === 'good').length
  const progressPercent = Math.round((completedCount / inspectionPoints.length) * 100)

  // Validation: all points evaluated, all bad have issueId+photo, seal photo, guard signed
  const validation = {
    allPointsEvaluated: completedCount === inspectionPoints.length,
    failuresHaveIssue: Object.values(points).every(p => p.status !== 'bad' || p.issueId),
    failuresHavePhoto: Object.values(points).every(p => p.status !== 'bad' || p.photo),
    hasSealPhoto: !!sealPhoto,
    guardSigned: !!(guardSignature.signature && guardSignature.name.trim()),
  }
  const canSubmit = validation.allPointsEvaluated && validation.failuresHaveIssue && validation.failuresHavePhoto && validation.hasSealPhoto && validation.guardSigned

  return (
    <InspectionContext.Provider value={{
      unitInfo, updateUnitInfo,
      points, setPointStatus, setPointIssue, setPointPhoto,
      sealPhoto, setSealPhoto,
      guardSignature, setGuardSignature,
      auditorSignature, setAuditorSignature,
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
