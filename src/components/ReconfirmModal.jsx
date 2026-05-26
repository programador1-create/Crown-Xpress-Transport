import { useState, useEffect } from 'react'
import { X, AlertTriangle, Camera, Check, Eye } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { inspectionPoints, errorReports } from '../data/inspectionPoints'
import CameraModal from './CameraModal'
import PhotoViewerModal from './PhotoViewerModal'
import IssueSelectModal from './IssueSelectModal'

/**
 * ReconfirmModal: lets a guard fix points from an existing inspection.
 * Creates a NEW inspection record linked to the original.
 */
export default function ReconfirmModal({ open, originalInspection, onClose, onSubmit }) {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [reconfirmPoints, setReconfirmPoints] = useState({})
  const [reason, setReason] = useState('')
  const [activePointId, setActivePointId] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [issueOpen, setIssueOpen] = useState(false)

  useEffect(() => {
    if (open && originalInspection) {
      // Pre-populate with original point states
      const initial = {}
      const originalPoints = originalInspection.points || []
      
      // Initialize all 20 inspection points
      for (let i = 1; i <= 20; i++) {
        // Find the point data from the original inspection (uses point_id from DB)
        const pointData = originalPoints.find(p => p.point_id === i)
        
        initial[i] = {
          original: { 
            status: pointData?.status || 'pending', 
            issueId: pointData?.issue_id || null, 
            hasPhoto: !!pointData?.photo 
          },
          status: pointData?.status || 'pending',
          issueId: pointData?.issue_id || null,
          photo: null, // Will be re-captured
          modified: false,
        }
      }
      setReconfirmPoints(initial)
      setReason('')
    }
  }, [open, originalInspection])

  if (!open || !originalInspection) return null

  const toggleStatus = (pointId, status) => {
    setReconfirmPoints(prev => ({
      ...prev,
      [pointId]: {
        ...prev[pointId],
        status,
        modified: true,
      }
    }))
  }

  const setPhoto = (pointId, photo) => {
    setReconfirmPoints(prev => ({
      ...prev,
      [pointId]: { ...prev[pointId], photo, modified: true }
    }))
  }

  const setIssue = (pointId, issueId) => {
    setReconfirmPoints(prev => ({
      ...prev,
      [pointId]: { ...prev[pointId], issueId, modified: true }
    }))
  }

  const modifiedPoints = Object.entries(reconfirmPoints).filter(([_, p]) => p.modified)
  
  // Validate: bad points must have issue and photo
  const badPointsValid = modifiedPoints.every(([_, p]) => {
    if (p.status === 'bad') {
      return p.issueId && p.photo
    }
    return true
  })
  
  const canSubmit = modifiedPoints.length > 0 && reason.trim().length >= 10 && badPointsValid

  const handleSubmit = () => {
    if (!canSubmit) return
    
    // Build points payload with all 20 points
    const pointsPayload = {}
    let goodCount = 0
    let badCount = 0
    let pendingCount = 0
    
    for (const [id, p] of Object.entries(reconfirmPoints)) {
      pointsPayload[id] = {
        status: p.status || 'pending',
        issueId: p.issueId || null,
        issueText: null,
        photo: p.photo || null,
        modified: p.modified || false,
      }
      if (p.status === 'good') goodCount++
      else if (p.status === 'bad') badCount++
      else pendingCount++
    }
    
    // Get original inspection data
    const orig = originalInspection.inspection || originalInspection
    
    onSubmit({
      original_inspection_id: orig.id,
      unitInfo: {
        trailerNumber: orig.trailer_number,
        containerNumber: orig.container_number,
        sealNumber: orig.seal_number,
        lockNumber: orig.lock_number,
        driverName: orig.driver_name,
        odometer: orig.odometer,
        location: orig.location,
        inspectionDate: new Date().toISOString(),
        highSecuritySeal: orig.high_security_seal,
        sealAffixed: orig.seal_affixed,
      },
      points: pointsPayload,
      guardSignature: {
        name: user.full_name,
        signature: null, // Reconfirmations don't require new signature
        signedAt: new Date().toISOString(),
      },
      auditorSignature: null,
      sealPhoto: null,
      language: language,
      counts: { good: goodCount, bad: badCount, pending: pendingCount },
      reason,
      reconfirmed_by: user.id,
      reconfirmed_by_name: user.full_name,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">
                {language === 'es' ? 'Reconfirmación de Inspección' : 'Inspection Reconfirmation'}
              </h2>
              <p className="text-xs text-white/80">
                {language === 'es' ? 'Trailer' : 'Trailer'}: {originalInspection.inspection?.trailer_number || originalInspection.trailer_number}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason */}
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            {language === 'es' ? 'Razón de la reconfirmación' : 'Reason for reconfirmation'}
            <span className="text-rose-500"> *</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
            rows={3}
            placeholder={language === 'es' ? 'Ej: El punto 5 estaba mal marcado...' : 'Ex: Point 5 was incorrectly marked...'}
            minLength={10}
          />
          <p className={`text-xs mt-1 ${reason.length >= 10 ? 'text-emerald-600' : 'text-slate-500'}`}>
            {language === 'es' ? 'Mínimo 10 caracteres' : 'Minimum 10 characters'} · {reason.length}/10
          </p>
        </div>

        {/* Points list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-sm text-slate-600 mb-3">
            {language === 'es'
              ? 'Seleccione los puntos a corregir. Solo se modificarán los puntos que cambie.'
              : 'Select the points to correct. Only modified points will be changed.'}
          </p>
          <div className="space-y-2">
            {inspectionPoints.map(point => {
              const rp = reconfirmPoints[point.id]
              if (!rp) return null
              const isModified = rp.modified
              const isBad = rp.status === 'bad'
              const isGood = rp.status === 'good'
              const issue = errorReports.find(e => e.id === rp.issueId)
              const origIssue = errorReports.find(e => e.id === rp.original?.issueId)

              return (
                <div key={point.id} className={`border-2 rounded-lg p-3 transition-all ${
                  isModified
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-slate-200 bg-white'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      isBad ? 'bg-rose-600 text-white' :
                      isGood ? 'bg-emerald-600 text-white' :
                      'bg-slate-300 text-slate-600'
                    }`}>
                      {point.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-800">{point[language]}</div>

                      {/* Original state */}
                      <div className="text-xs text-slate-500 mt-1">
                        {language === 'es' ? 'Original' : 'Original'}:{' '}
                        <span className="font-medium">
                          {rp.original?.status === 'good' ? '✅ OK' :
                           rp.original?.status === 'bad' ? `❌ ${origIssue?.[language] || ''}` :
                           '— pendiente'}
                        </span>
                      </div>

                      {isModified && (
                        <div className="text-xs text-amber-700 font-semibold mt-1">
                          ⚠ {language === 'es' ? 'Modificado' : 'Modified'}:{' '}
                          {isGood ? '✅ OK' : isBad ? `❌ ${issue?.[language] || (language === 'es' ? 'seleccionar...' : 'select...')}` : ''}
                        </div>
                      )}

                      {/* Actions when bad */}
                      {isBad && isModified && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => { setActivePointId(point.id); setIssueOpen(true) }}
                            className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-md hover:bg-rose-200"
                          >
                            {issue ? issue[language] : (language === 'es' ? 'Seleccionar falla' : 'Select issue')}
                          </button>
                          <button
                            onClick={() => { setActivePointId(point.id); rp.photo ? setViewerOpen(true) : setCameraOpen(true) }}
                            className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 ${
                              rp.photo ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {rp.photo ? <Eye className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                            {rp.photo ? (language === 'es' ? 'Ver foto' : 'View photo') : (language === 'es' ? 'Tomar foto' : 'Take photo')}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 flex-shrink-0">
                      <button
                        onClick={() => toggleStatus(point.id, 'good')}
                        className={`px-2 py-1 rounded-md text-xs font-bold ${
                          isGood ? 'bg-emerald-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleStatus(point.id, 'bad')}
                        className={`px-2 py-1 rounded-md text-xs font-bold ${
                          isBad ? 'bg-rose-600 text-white' : 'text-slate-500'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          {/* Validation messages */}
          {!badPointsValid && modifiedPoints.length > 0 && (
            <div className="mb-3 px-3 py-2 bg-rose-100 border border-rose-300 rounded-lg text-sm text-rose-700">
              ⚠️ {language === 'es' 
                ? 'Los puntos marcados como MALO deben tener tipo de falla y foto' 
                : 'Points marked as BAD must have issue type and photo'}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {modifiedPoints.length} {language === 'es' ? 'puntos modificados' : 'modified points'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-4 py-2 text-sm font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              {language === 'es' ? 'Crear Reconfirmación' : 'Create Reconfirmation'}
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onConfirm={(photo) => { setPhoto(activePointId, photo); setCameraOpen(false) }}
        title={language === 'es' ? `Foto Punto ${activePointId}` : `Photo Point ${activePointId}`}
      />
      <PhotoViewerModal
        open={viewerOpen}
        photo={activePointId ? reconfirmPoints[activePointId]?.photo : null}
        onClose={() => setViewerOpen(false)}
        onRetake={() => { setViewerOpen(false); setCameraOpen(true) }}
      />
      <IssueSelectModal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        onSelect={(id) => { setIssue(activePointId, id); setIssueOpen(false) }}
        currentIssueId={activePointId ? reconfirmPoints[activePointId]?.issueId : null}
        pointId={activePointId}
        pointName={activePointId ? inspectionPoints.find(p => p.id === activePointId)?.[language] : ''}
      />
    </div>
  )
}
