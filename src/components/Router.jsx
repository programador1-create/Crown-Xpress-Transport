import { useState } from 'react'
import { ClipboardCheck, History, Home, ShieldCheck, FileText } from 'lucide-react'
import GuidedInspection from './GuidedInspection'
import UnitInfo from './UnitInfoEnhanced'
import TruckDiagram from './TruckDiagram'
import InspectionList from './InspectionList'
import SealPhoto from './SealPhoto'
import SignaturesSection from './SignaturesSection'
import SubmitBar from './SubmitBar'
import SuccessModal from './SuccessModal'
import InspectionHistory from './InspectionHistory'
import GuardHistory from './GuardHistory'
import AuditorView from './AuditorView'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { useAuth } from '../context/AuthContext'

export default function Router() {
  const { t, language } = useLanguage()
  const { resetInspection } = useInspection()
  const { user, canEdit, canViewAll } = useAuth()
  const [page, setPage] = useState(canViewAll() && !canEdit() ? 'auditor' : 'form')
  const [success, setSuccess] = useState({ open: false, filename: null })

  const handleSuccess = (payload) => {
    setSuccess({ open: true, filename: payload.filename })
    // Optionally switch to history after success
    // setPage('history')
  }

  const handleNewInspection = () => {
    resetInspection()
    setSuccess({ open: false, filename: null })
    setPage('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const tabs = [
    canEdit() && { id: 'form', label: 'v1 - Vista Clásica', icon: FileText },
    canEdit() && { id: 'guided', label: 'v2 - Inspección Guiada', icon: Home },
    canEdit() && { id: 'my-history', label: language === 'es' ? 'Mi Historial' : 'My History', icon: History },
    canViewAll() && { id: 'auditor', label: language === 'es' ? 'Vista Auditor' : 'Auditor View', icon: ShieldCheck },
  ].filter(Boolean)

  const Nav = () => (
    <nav className="sticky top-14 z-20 bg-white border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 py-2 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setPage(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  page === tab.id
                    ? 'bg-crown-navy text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )

  return (
    <>
      <Nav />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {page === 'form' && canEdit() && (
          <div className="space-y-5">
            <UnitInfo />
            <TruckDiagram />
            <InspectionList />
            <SealPhoto />
            <SignaturesSection />
            <SubmitBar onSuccess={handleSuccess} />
          </div>
        )}
        {page === 'guided' && canEdit() && (
          <div className="space-y-5">
            <GuidedInspection />
            <SubmitBar onSuccess={handleSuccess} />
          </div>
        )}
        {page === 'my-history' && canEdit() && <GuardHistory />}
        {page === 'auditor' && canViewAll() && <AuditorView />}
      </div>

      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur py-4 mt-2 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-500">
            {t('footer')} · <span className="font-mono text-crown-gold-dark">{t('formCode')}</span>
          </p>
        </div>
      </footer>

      <SuccessModal
        open={success.open}
        filename={success.filename}
        onClose={() => setSuccess({ open: false, filename: null })}
        onNew={handleNewInspection}
      />
    </>
  )
}
