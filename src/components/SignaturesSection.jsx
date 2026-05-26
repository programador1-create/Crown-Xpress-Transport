import { useEffect } from 'react'
import { PenLine, ShieldCheck, UserCheck } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { useAuth } from '../context/AuthContext'
import SignatureBox from './SignatureBox'

export default function SignaturesSection() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { guardSignature, setGuardSignature, auditorSignature, setAuditorSignature } = useInspection()

  // Auto-fill guard name from logged in user on mount
  useEffect(() => {
    if (user?.full_name) {
      setGuardSignature(prev => ({ ...prev, name: user.full_name }))
    }
  }, [user?.full_name, setGuardSignature])

  return (
    <section className="card animate-slide-up">
      <div className="card-header flex items-center gap-3">
        <PenLine className="w-5 h-5 text-crown-gold" />
        <h2 className="font-bold tracking-wide uppercase text-sm">{t('signaturesTitle')}</h2>
      </div>
      <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
        <SignatureBox
          label={
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> {t('guardSignature')}
            </span>
          }
          name={guardSignature.name}
          onNameChange={(name) => setGuardSignature(prev => ({ ...prev, name }))}
          namePlaceholder={t('guardName')}
          value={guardSignature.signature}
          onChange={(sig) => setGuardSignature(prev => ({
            ...prev,
            signature: sig,
            signedAt: sig ? new Date().toISOString() : null
          }))}
          accent="navy"
        />
        <SignatureBox
          label={
            <span className="inline-flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> {t('auditorSignature')}
            </span>
          }
          name={auditorSignature.name}
          onNameChange={(name) => setAuditorSignature(prev => ({ ...prev, name }))}
          namePlaceholder={t('auditorName')}
          value={auditorSignature.signature}
          onChange={(sig) => setAuditorSignature(prev => ({
            ...prev,
            signature: sig,
            signedAt: sig ? new Date().toISOString() : null
          }))}
          accent="gold"
          optional
          optionalLabel={t('auditorOptional')}
        />
      </div>
    </section>
  )
}
