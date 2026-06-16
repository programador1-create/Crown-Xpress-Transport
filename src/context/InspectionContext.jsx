import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const InspectionContext = createContext()

const initialPoints = () => ({
  1: { status: null, issueId: null, issueCustomText: null, photo: null },
  2: { status: null, issueId: null, issueCustomText: null, photo: null },
  3: { status: null, issueId: null, issueCustomText: null, photo: null },
  4: { status: null, issueId: null, issueCustomText: null, photo: null },
  5: { status: null, issueId: null, issueCustomText: null, photo: null },
  6: { status: null, issueId: null, issueCustomText: null, photo: null },
  7: { status: null, issueId: null, issueCustomText: null, photo: null },
  8: { status: null, issueId: null, issueCustomText: null, photo: null },
  9: { status: null, issueId: null, issueCustomText: null, photo: null },
  10: { status: null, issueId: null, issueCustomText: null, photo: null },
  11: { status: null, issueId: null, issueCustomText: null, photo: null },
  12: { status: null, issueId: null, issueCustomText: null, photo: null },
  13: { status: null, issueId: null, issueCustomText: null, photo: null },
  14: { status: null, issueId: null, issueCustomText: null, photo: null },
  15: { status: null, issueId: null, issueCustomText: null, photo: null },
  16: { status: null, issueId: null, issueCustomText: null, photo: null },
  17: { status: null, issueId: null, issueCustomText: null, photo: null },
  18: { status: null, issueId: null, issueCustomText: null, photo: null },
  19: { status: null, issueId: null, issueCustomText: null, photo: null },
  20: { status: null, issueId: null, issueCustomText: null, photo: null },
})

export function InspectionProvider({ children }) {
  // Unit info
  const [unitInfo, setUnitInfo] = useState({
    trailerNumber: '',
    sealNumber: '',
    driverName: '',
    inspectionDate: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' }),
    guardName: '',
    highSecuritySeal: 'yes',
    sealAffixed: 'yes',
  })

  // 20 inspection points state
  const [points, setPoints] = useState(initialPoints)

  // Seal photo
  const [sealPhoto, setSealPhoto] = useState(null)

  // Signatures
  const [guardSignature, setGuardSignature] = useState({ name: '', signature: null, signedAt: null })
  const [supervisorSignature, setSupervisorSignature] = useState({ name: '', signature: null, signedAt: null })
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
      driverName: '',
      inspectionDate: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' }),
      guardName: '',
      highSecuritySeal: 'yes',
      sealAffixed: 'yes',
    })
    setPoints(initialPoints())
    setSealPhoto(null)
    setGuardSignature({ name: '', signature: null, signedAt: null })
    setSupervisorSignature({ name: '', signature: null, signedAt: null })
    setOperatorSignature({ name: '', signature: null, signedAt: null })
  }, [])

  // Simple applicable points - always return all 20 points for now
  const applicablePoints = useMemo(() => {
    return [
      { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
      { id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }, { id: 10 },
      { id: 11 }, { id: 12 }, { id: 13 }, { id: 14 }, { id: 15 },
      { id: 16 }, { id: 17 }, { id: 18 }, { id: 19 }, { id: 20 }
    ]
  }, [])

  const applicablePointIds = useMemo(() => {
    return applicablePoints.map(p => p.id)
  }, [applicablePoints])

  // Computed
  const completedCount = applicablePointIds.filter(id => points[id]?.status !== null).length
  const failedCount = applicablePointIds.filter(id => points[id]?.status === 'bad').length
  const goodCount = applicablePointIds.filter(id => points[id]?.status === 'good').length
  const progressPercent = applicablePoints.length > 0 ? Math.round((completedCount / applicablePoints.length) * 100) : 0

  // Validation
  const validation = {
    allPointsEvaluated: completedCount === applicablePoints.length,
    failuresHaveIssue: applicablePointIds.every(id => points[id]?.status !== 'bad' || points[id]?.issueId),
    failuresHavePhoto: applicablePointIds.every(id => points[id]?.status !== 'bad' || points[id]?.photo),
    hasSealPhoto: !!sealPhoto,
    sealPhotoValid: !!sealPhoto,
    guardSigned: !!(guardSignature.signature && guardSignature.name.trim()),
    operatorSigned: !!(operatorSignature.signature && operatorSignature.name.trim()),
  }

  const canSubmit = validation.allPointsEvaluated && validation.failuresHaveIssue && validation.failuresHavePhoto && validation.guardSigned && validation.sealPhotoValid

  return (
    <InspectionContext.Provider value={{
      unitInfo, updateUnitInfo,
      points, setPointStatus, setPointIssue, setPointPhoto,
      sealPhoto, setSealPhoto,
      guardSignature, setGuardSignature,
      supervisorSignature, setSupervisorSignature,
      operatorSignature, setOperatorSignature,
      resetInspection,
      completedCount, failedCount, goodCount, progressPercent,
      validation, canSubmit,
    }}>
      {children}
    </InspectionContext.Provider>
  )
}

export const useInspection = () => {
  const context = useContext(InspectionContext)
  if (!context) {
    throw new Error('useInspection must be used within an InspectionProvider')
  }
  return context
}
