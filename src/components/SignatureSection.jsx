import { useState, useMemo } from 'react'
import { PenTool, User, ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { useAuth } from '../context/AuthContext'
import { getApplicablePoints } from '../data/inspectionPoints'
import SignatureCanvas from './SignatureCanvas'

export default function SignatureSection() {
  const { t, language } = useLanguage()
  const { guardSignature, auditorSignature, setGuardSignature, setAuditorSignature, unitInfo, points, completedCount } = useInspection()
  const { user } = useAuth()
  const [showGuardSignature, setShowGuardSignature] = useState(false)
  const [showAuditorSignature, setShowAuditorSignature] = useState(false)
  const [enableAuditor, setEnableAuditor] = useState(false)
  
  // Check if all points are completed
  const applicablePoints = useMemo(() => {
    return getApplicablePoints(unitInfo?.inspectionType)
  }, [unitInfo?.inspectionType])
  
  const totalPoints = applicablePoints.length
  const allPointsCompleted = completedCount === totalPoints

  const handleGuardSignatureSave = (signature) => {
    setGuardSignature({
      name: user?.full_name || '',
      signature,
      signedAt: new Date().toISOString()
    })
    setShowGuardSignature(false)
  }

  const handleAuditorSignatureSave = (signature) => {
    setAuditorSignature({
      name: auditorSignature.name || '',
      signature,
      signedAt: new Date().toISOString()
    })
    setShowAuditorSignature(false)
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
              {language === 'es' ? 'Firmando como:' : 'Signing as:'}
            </p>
            <p className="font-semibold text-crown-navy">{user?.full_name || '—'}</p>
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
                <p><strong>{language === 'es' ? 'Nombre:' : 'Name:'}</strong> {guardSignature.name}</p>
                <p><strong>{language === 'es' ? 'Fecha:' : 'Date:'}</strong> {new Date(guardSignature.signedAt).toLocaleString(language === 'es' ? 'es-MX' : 'en-US')}</p>
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

        {/* Auditor Signature - Optional with checkbox */}
        {allPointsCompleted && (
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-crown-navy" />
              <h3 className="font-semibold text-slate-700">
                {language === 'es' ? 'Firma del Auditor' : 'Auditor Signature'}
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAuditor}
                onChange={(e) => setEnableAuditor(e.target.checked)}
                className="w-4 h-4 text-crown-navy focus:ring-crown-navy border-slate-300 rounded"
              />
              <span className="text-xs text-slate-600">
                {language === 'es' ? 'Requiere auditor' : 'Requires auditor'}
              </span>
            </label>
          </div>
          
          {!enableAuditor ? (
            <div className="text-center py-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">
                {language === 'es' 
                  ? 'Marque la casilla si esta inspección requiere firma de auditor' 
                  : 'Check the box if this inspection requires auditor signature'}
              </p>
            </div>
          ) : auditorSignature.signature ? (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded p-2 bg-white">
                <img 
                  src={auditorSignature.signature} 
                  alt="Auditor signature" 
                  className="h-20 object-contain"
                />
              </div>
              <div className="text-sm text-slate-600">
                <p><strong>{language === 'es' ? 'Nombre:' : 'Name:'}</strong> {auditorSignature.name}</p>
                <p><strong>{language === 'es' ? 'Fecha:' : 'Date:'}</strong> {new Date(auditorSignature.signedAt).toLocaleString(language === 'es' ? 'es-MX' : 'en-US')}</p>
              </div>
              <button
                onClick={() => setShowAuditorSignature(true)}
                className="btn-secondary text-sm"
              >
                <PenTool className="w-4 h-4" />
                {language === 'es' ? 'Cambiar firma' : 'Change signature'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={auditorSignature.name}
                onChange={(e) => setAuditorSignature(prev => ({ ...prev, name: e.target.value }))}
                placeholder={language === 'es' ? 'Nombre del auditor' : 'Auditor name'}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
              />
              <div className="text-center py-2">
                <p className="text-sm text-slate-600 mb-3">
                  {language === 'es' ? 'Se requiere firma del auditor' : 'Auditor signature required'}
                </p>
                <button
                  onClick={() => setShowAuditorSignature(true)}
                  disabled={!auditorSignature.name}
                  className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PenTool className="w-4 h-4" />
                  {language === 'es' ? 'Firmar como Auditor' : 'Sign as Auditor'}
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
        open={showAuditorSignature}
        onClose={() => setShowAuditorSignature(false)}
        onSave={handleAuditorSignatureSave}
        title={language === 'es' ? 'Firma del Auditor' : 'Auditor Signature'}
        signerName={auditorSignature.name}
      />
    </section>
  )
}
