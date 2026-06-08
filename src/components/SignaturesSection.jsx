import { useEffect, useState, useMemo } from 'react'
import { PenLine, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { useAuth } from '../context/AuthContext'
import { getApplicablePoints } from '../data/inspectionPoints'
import SignatureBox from './SignatureBox'

export default function SignaturesSection() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const { 
    guardSignature, setGuardSignature, 
    auditorSignature, setAuditorSignature,
    unitInfo, completedCount
  } = useInspection()
  const [enableAuditor, setEnableAuditor] = useState(false)
  
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

  return (
    <section className="card animate-slide-up">
      <div className="card-header flex items-center gap-3">
        <PenLine className="w-5 h-5 text-crown-gold" />
        <h2 className="font-bold tracking-wide uppercase text-sm">{t('signaturesTitle')}</h2>
      </div>
      <div className="card-body space-y-4">
        <p className="text-sm text-slate-500 text-center">
          {language === 'es' 
            ? 'LA FIRMA DEL OPERADOR SE CAPTURARÁ AL MOMENTO DE GENERAR EL PDF' 
            : 'OPERATOR SIGNATURE WILL BE CAPTURED WHEN GENERATING THE PDF'}
        </p>
        
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
        <SignatureBox
          label={
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> {t('guardSignature').toUpperCase()}
            </span>
          }
          name={guardSignature.name}
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
        )}
        
        {/* Auditor Signature Checkbox - Only show when all points completed */}
        {allPointsCompleted && (
        <>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAuditor}
                onChange={(e) => setEnableAuditor(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-crown-gold focus:ring-crown-gold cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-crown-gold" />
                <span className="font-semibold text-slate-700">
                  {language === 'es' ? '¿Requiere firma de auditor?' : 'Requires auditor signature?'}
                </span>
              </div>
            </label>
          </div>
          
          {/* Auditor Signature - Only if enabled */}
          {enableAuditor && (
            <SignatureBox
              label={
                <span className="inline-flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> {t('auditorSignature').toUpperCase()}
                </span>
              }
              name={auditorSignature.name}
              onNameChange={(name) => setAuditorSignature(prev => ({ ...prev, name: name.toUpperCase() }))}
              namePlaceholder={t('auditorName').toUpperCase()}
              value={auditorSignature.signature}
              onChange={(sig) => setAuditorSignature(prev => ({
                ...prev,
                signature: sig,
                signedAt: sig ? new Date().toISOString() : null
              }))}
              accent="gold"
              optional
              optionalLabel={t('auditorOptional').toUpperCase()}
            />
          )}
        </>
        )}
      </div>
    </section>
  )
}
