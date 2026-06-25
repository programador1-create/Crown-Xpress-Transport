import { useEffect, useState, useMemo } from 'react'
import { PenLine, ShieldCheck, UserCheck, AlertTriangle, ChevronDown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { useAuth } from '../context/AuthContext'
import { getApplicablePoints } from '../data/inspectionPoints'
import { getSupervisorsByYard } from '../utils/api'
import SignatureBox from './SignatureBox'

export default function SignaturesSection() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const {
    guardSignature, setGuardSignature,
    supervisorSignature, setSupervisorSignature,
    unitInfo, completedCount
  } = useInspection()
  const [enableSupervisor, setEnableSupervisor] = useState(false)
  const [supervisors, setSupervisors] = useState([])
  const [loadingSupervisors, setLoadingSupervisors] = useState(false)
  
  // Check if all points are completed
  const applicablePoints = useMemo(() => {
    return getApplicablePoints(unitInfo?.inspectionType)
  }, [unitInfo?.inspectionType])
  
  const totalPoints = applicablePoints.length
  const allPointsCompleted = completedCount === totalPoints

  // Auto-fill guard name from logged in user on mount
  useEffect(() => {
    if (user?.full_name) {
      setGuardSignature(prev => ({ ...prev, name: user.full_name.toUpperCase() }))
    }
  }, [user?.full_name, setGuardSignature])

  // Load supervisors for current yard
  useEffect(() => {
    const loadSupervisors = async () => {
      const yardCode = unitInfo?.location || user?.location_name
      if (!yardCode) return
      
      setLoadingSupervisors(true)
      try {
        const sups = await getSupervisorsByYard(yardCode)
        setSupervisors(sups)
        
        // If only one supervisor, enable supervisor and auto-select name
        // Only if user hasn't explicitly disabled supervisor signature
        if (sups.length === 1 && !supervisorSignature?.name && !supervisorSignature?.signature) {
          setEnableSupervisor(true)
          setSupervisorSignature(prev => ({ ...prev, name: sups[0].full_name.toUpperCase(), signature: null, signedAt: null }))
        }
      } catch (err) {
        console.error('Error loading supervisors:', err)
      } finally {
        setLoadingSupervisors(false)
      }
    }
    
    loadSupervisors()
  }, [unitInfo?.location, user?.location_name])

  // Hide entire signatures section until all points are completed
  if (!allPointsCompleted) {
    return null
  }

  return (
    <section className="card animate-slide-up">
      <div className="card-header flex items-center gap-3">
        <PenLine className="w-5 h-5 text-crown-gold" />
        <h2 className="font-bold tracking-wide uppercase text-sm">{t('signaturesTitle')}</h2>
      </div>
      <div className="card-body space-y-4">
        <p className="text-xs text-slate-400 text-center italic">
          {language === 'es' 
            ? 'La firma del operador se capturará al generar el PDF (requerida)' 
            : 'Operator signature will be captured when generating PDF (required)'}
        </p>
        
        {/* Guard Signature */}
        <SignatureBox
          label={
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> {t('guardSignature').toUpperCase()}
            </span>
          }
          name={guardSignature?.name || ''}
          onNameChange={(name) => setGuardSignature(prev => ({ ...prev, name: name.toUpperCase() }))}
          namePlaceholder={t('guardName').toUpperCase()}
          value={guardSignature.signature}
          onChange={(sig) => setGuardSignature(prev => ({
            ...prev,
            signature: sig,
            signedAt: sig ? new Date().toISOString() : null
          }))}
          accent="navy"
          nameReadOnly={true}
        />
        
        {/* Supervisor Signature Checkbox */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableSupervisor}
                onChange={(e) => {
                  setEnableSupervisor(e.target.checked)
                  // When disabled, clear supervisor signature
                  if (!e.target.checked) {
                    setSupervisorSignature({ name: '', signature: null, signedAt: null })
                  }
                }}
                className="w-5 h-5 rounded border-slate-300 text-crown-gold focus:ring-crown-gold cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-crown-gold" />
                <span className="font-semibold text-slate-700">
                  {language === 'es' ? '¿Requiere firma de supervisor?' : 'Requires supervisor signature?'}
                </span>
              </div>
            </label>
          </div>
          
          {/* Supervisor Signature - Only if enabled */}
          {enableSupervisor && (
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
              <SignatureBox
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> {t('supervisorSignature').toUpperCase()}
                  </span>
                }
                name={supervisorSignature?.name || ''}
                onNameChange={(name) => setSupervisorSignature(prev => ({ ...prev, name: name.toUpperCase() }))}
                namePlaceholder={t('supervisorName').toUpperCase()}
                value={supervisorSignature.signature}
                onChange={(sig) => setSupervisorSignature(prev => ({
                  ...prev,
                  signature: sig,
                  signedAt: sig ? new Date().toISOString() : null
                }))}
                accent="gold"
                optional
                optionalLabel={t('supervisorOptional').toUpperCase()}
                nameReadOnly={supervisors.length > 1}
              />
            </div>
          )}
      </div>
    </section>
  )
}
