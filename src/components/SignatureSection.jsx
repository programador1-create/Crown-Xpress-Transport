import { useState, useMemo, useEffect } from 'react'
import { PenTool, User, ShieldCheck, CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { useAuth } from '../context/AuthContext'
import { getApplicablePoints } from '../data/inspectionPoints'
import { getSupervisorsByYard } from '../utils/api'
import SignatureCanvas from './SignatureCanvas'

export default function SignatureSection() {
  const { t, language } = useLanguage()
  const { guardSignature, supervisorSignature, operatorSignature, setGuardSignature, setSupervisorSignature, setOperatorSignature, unitInfo, points, completedCount } = useInspection()
  const { user } = useAuth()
  const [showGuardSignature, setShowGuardSignature] = useState(false)
  const [showSupervisorSignature, setShowSupervisorSignature] = useState(false)
  const [showOperatorSignature, setShowOperatorSignature] = useState(false)
  const [enableSupervisor, setEnableSupervisor] = useState(false)
  const [supervisors, setSupervisors] = useState([])
  const [loadingSupervisors, setLoadingSupervisors] = useState(false)
  
  // Check if all points are completed
  const applicablePoints = useMemo(() => {
    return getApplicablePoints(unitInfo?.inspectionType)
  }, [unitInfo?.inspectionType])
  
  const totalPoints = applicablePoints.length
  const allPointsCompleted = completedCount === totalPoints

  // Load supervisors for current yard
  useEffect(() => {
    const loadSupervisors = async () => {
      const yardCode = unitInfo?.location || user?.location_name
      if (!yardCode) return
      
      setLoadingSupervisors(true)
      try {
        const sups = await getSupervisorsByYard(yardCode)
        setSupervisors(sups)
        
        // If only one supervisor and no name selected, auto-select
        if (sups.length === 1 && !supervisorSignature?.name) {
          setSupervisorSignature(prev => ({ ...prev, name: sups[0].full_name.toUpperCase() }))
        }
      } catch (err) {
        console.error('Error loading supervisors:', err)
      } finally {
        setLoadingSupervisors(false)
      }
    }
    
    loadSupervisors()
  }, [unitInfo?.location, user?.location_name])

  const handleGuardSignatureSave = (signature) => {
    setGuardSignature({
      name: user?.full_name || '',
      signature,
      signedAt: new Date().toISOString()
    })
    setShowGuardSignature(false)
  }

  const handleSupervisorSignatureSave = (signature) => {
    setSupervisorSignature({
      name: supervisorSignature?.name || '',
      signature,
      signedAt: new Date().toISOString()
    })
    setShowSupervisorSignature(false)
  }

  const handleOperatorSignatureSave = (signature) => {
    setOperatorSignature({
      name: unitInfo?.driverName?.toUpperCase() || '',
      signature,
      signedAt: new Date().toISOString()
    })
    setShowOperatorSignature(false)
  }

  return (
    <section className="card animate-slide-up">
      <div className="card-header flex items-center gap-3">
        <PenTool className="w-5 h-5 text-crown-gold" />
        <h2 className="font-bold tracking-wide uppercase text-sm">{t('signatures')}</h2>
      </div>
      <div className="card-body space-y-6">
        {/* Warning if points not completed */}
        {!allPointsCompleted && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">
                {language === 'es' ? 'Complete la inspección primero' : 'Complete inspection first'}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {language === 'es' 
                  ? `Debe completar todos los ${totalPoints} puntos de inspección antes de firmar.` 
                  : `You must complete all ${totalPoints} inspection points before signing.`}
              </p>
              <p className="text-xs font-semibold text-amber-900 mt-2">
                {language === 'es' ? `Completados: ${completedCount}/${totalPoints}` : `Completed: ${completedCount}/${totalPoints}`}
              </p>
            </div>
          </div>
        )}
        
        {/* Guard Signature - Only show when all points completed */}
        {allPointsCompleted && (
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-crown-navy" />
            <h3 className="font-semibold text-slate-700">
              {language === 'es' ? 'Firma del Guardia' : 'Guard Signature'}
            </h3>
          </div>
          
          {/* Show logged in user name */}
          <div className="bg-slate-50 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-slate-500 mb-1">
              {language === 'es' ? 'Guardia:' : 'Guard:'}
            </p>
            <p className="font-semibold text-crown-navy">{user?.full_name?.toUpperCase() || '—'}</p>
          </div>
          
          {guardSignature.signature ? (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded p-2 bg-white">
                <img 
                  src={guardSignature.signature} 
                  alt="Guard signature" 
                  className="h-20 object-contain"
                />
              </div>
              <div className="text-sm text-slate-600">
                <p><strong>{language === 'es' ? 'Fecha:' : 'Date:'}</strong> {guardSignature?.signedAt ? new Date(guardSignature.signedAt).toLocaleString(language === 'es' ? 'es-MX' : 'en-US') : '—'}</p>
              </div>
              <button
                onClick={() => setShowGuardSignature(true)}
                className="btn-secondary text-sm"
              >
                <PenTool className="w-4 h-4" />
                {language === 'es' ? 'Cambiar firma' : 'Change signature'}
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-600 mb-3">
                {language === 'es' ? 'Se requiere firma del guardia' : 'Guard signature required'}
              </p>
              <button
                onClick={() => setShowGuardSignature(true)}
                className="btn-gold"
              >
                <PenTool className="w-4 h-4" />
                {language === 'es' ? 'Firmar como Guardia' : 'Sign as Guard'}
              </button>
            </div>
          )}
        </div>
        )}

        {/* Operator Signature - Show when all points completed and driver name is available */}
        {allPointsCompleted && unitInfo?.driverName && (
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-crown-navy" />
            <h3 className="font-semibold text-slate-700">
              {language === 'es' ? 'Firma del Operador' : 'Operator Signature'}
            </h3>
          </div>

          {/* Show operator name */}
          <div className="bg-slate-50 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-slate-500 mb-1">
              {language === 'es' ? 'Operador:' : 'Operator:'}
            </p>
            <p className="font-semibold text-crown-navy">{unitInfo?.driverName?.toUpperCase() || '—'}</p>
          </div>

          <div className="text-center py-4">
            <p className="text-sm text-slate-600">
              {language === 'es'
                ? 'La firma del operador se capturará al generar el PDF (requerida)'
                : 'Operator signature will be captured when generating PDF (required)'}
            </p>
          </div>
        </div>
        )}

        {/* Supervisor Signature - Optional with checkbox */}
        {allPointsCompleted && (
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-crown-navy" />
              <h3 className="font-semibold text-slate-700">
                {language === 'es' ? 'Firma del Supervisor' : 'Supervisor Signature'}
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableSupervisor}
                onChange={(e) => setEnableSupervisor(e.target.checked)}
                className="w-4 h-4 text-crown-navy focus:ring-crown-navy border-slate-300 rounded"
              />
              <span className="text-xs text-slate-600">
                {language === 'es' ? 'Requiere supervisor' : 'Requires supervisor'}
              </span>
            </label>
          </div>
          
          {!enableSupervisor ? (
            <div className="text-center py-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">
                {language === 'es'
                  ? 'Marque la casilla si esta inspección requiere firma de supervisor'
                  : 'Check the box if this inspection requires supervisor signature'}
              </p>
            </div>
          ) : supervisorSignature?.signature ? (
            <div className="space-y-3">
              {/* Show supervisor name */}
              <div className="bg-slate-50 rounded-lg px-3 py-2 mb-3">
                <p className="text-xs text-slate-500 mb-1">
                  {language === 'es' ? 'Supervisor:' : 'Supervisor:'}
                </p>
                <p className="font-semibold text-crown-navy">{supervisorSignature?.name?.toUpperCase() || '—'}</p>
              </div>
              <div className="border border-slate-200 rounded p-2 bg-white">
                <img
                  src={supervisorSignature.signature}
                  alt="Supervisor signature"
                  className="h-20 object-contain"
                />
              </div>
              <div className="text-sm text-slate-600">
                <p><strong>{language === 'es' ? 'Fecha:' : 'Date:'}</strong> {supervisorSignature?.signedAt ? new Date(supervisorSignature.signedAt).toLocaleString(language === 'es' ? 'es-MX' : 'en-US') : '—'}</p>
              </div>
              <button
                onClick={() => setShowSupervisorSignature(true)}
                className="btn-secondary text-sm"
              >
                <PenTool className="w-4 h-4" />
                {language === 'es' ? 'Cambiar firma' : 'Change signature'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {supervisors.length > 1 ? (
                <div className="relative">
                  <select
                    value={supervisorSignature?.name || ''}
                    onChange={(e) => setSupervisorSignature(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20 appearance-none bg-white"
                  >
                    <option value="">{language === 'es' ? 'Seleccionar supervisor...' : 'Select supervisor...'}</option>
                    {supervisors.map(s => (
                      <option key={s.id} value={s.full_name.toUpperCase()}>
                        {s.full_name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              ) : (
                <input
                  type="text"
                  value={supervisorSignature?.name || ''}
                  onChange={(e) => setSupervisorSignature(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                  placeholder={language === 'es' ? 'Nombre del supervisor' : 'Supervisor name'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
                />
              )}
              <div className="text-center py-2">
                <p className="text-sm text-slate-600 mb-3">
                  {language === 'es' ? 'Se requiere firma del supervisor' : 'Supervisor signature required'}
                </p>
                <button
                  onClick={() => setShowSupervisorSignature(true)}
                  disabled={!supervisorSignature?.name}
                  className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PenTool className="w-4 h-4" />
                  {language === 'es' ? 'Firmar como Supervisor' : 'Sign as Supervisor'}
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      <SignatureCanvas
        open={showGuardSignature}
        onClose={() => setShowGuardSignature(false)}
        onSave={handleGuardSignatureSave}
        title={language === 'es' ? 'Firma del Guardia' : 'Guard Signature'}
        signerName={user?.full_name || ''}
      />

      <SignatureCanvas
        open={showSupervisorSignature}
        onClose={() => setShowSupervisorSignature(false)}
        onSave={handleSupervisorSignatureSave}
        title={language === 'es' ? 'Firma del Supervisor' : 'Supervisor Signature'}
        signerName={supervisorSignature?.name || ''}
      />

      <SignatureCanvas
        open={showOperatorSignature}
        onClose={() => setShowOperatorSignature(false)}
        onSave={handleOperatorSignatureSave}
        title={language === 'es' ? 'Firma del Operador' : 'Operator Signature'}
        signerName={unitInfo?.driverName?.toUpperCase() || ''}
      />
    </section>
  )
}
