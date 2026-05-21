import { CheckCircle2, FileText, Plus, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function SuccessModal({ open, onClose, onNew, filename }) {
  const { t, language } = useLanguage()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-crown-lg animate-slide-up">
        <div className="relative p-6 sm:p-8 text-center">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>

          <div className="relative inline-block mb-5">
            <div className="absolute -inset-3 bg-emerald-500/20 rounded-full animate-pulse-soft" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>

          <h2 className="text-2xl font-display font-bold text-crown-navy-dark mb-1">
            {t('inspectionCompleted')}
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            {t('pdfGenerated')}
          </p>

          {filename && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-5 text-left">
              <FileText className="w-4 h-4 text-crown-navy flex-shrink-0" />
              <span className="text-xs text-slate-600 font-mono truncate">{filename}</span>
            </div>
          )}

          <button
            onClick={onNew}
            className="btn-gold w-full text-base py-3"
          >
            <Plus className="w-5 h-5" />
            {t('newInspection')}
          </button>
        </div>
      </div>
    </div>
  )
}
