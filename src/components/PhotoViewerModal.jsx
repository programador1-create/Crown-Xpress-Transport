import { X, RotateCw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function PhotoViewerModal({ open, photo, onClose, onRetake, title }) {
  const { t } = useLanguage()
  if (!open || !photo) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden shadow-crown-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-crown-navy-dark to-crown-navy text-white">
          <h3 className="font-bold truncate pr-2">{title || t('viewPhoto')}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-slate-900 flex items-center justify-center max-h-[70vh] overflow-hidden">
          <img src={photo} alt="captured" className="max-w-full max-h-[70vh] object-contain" />
        </div>
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="btn-secondary">
            {t('cancel')}
          </button>
          <button onClick={onRetake} className="btn-gold ml-auto">
            <RotateCw className="w-4 h-4" /> {t('retakePhoto')}
          </button>
        </div>
      </div>
    </div>
  )
}
