import { useState } from 'react'
import { Camera, Shield } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import CameraModal from './CameraModal'
import PhotoViewerModal from './PhotoViewerModal'

export default function SealPhotoSection() {
  const { t, language } = useLanguage()
  const { sealPhoto, setSealPhoto } = useInspection()
  const [cameraOpen, setCameraOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)

  const handlePhotoConfirm = (photo) => {
    setSealPhoto(photo)
  }

  return (
    <section className="card animate-slide-up">
      <div className="card-header flex items-center gap-3">
        <Shield className="w-5 h-5 text-crown-gold" />
        <h2 className="font-bold tracking-wide uppercase text-sm">{t('sealPhoto')}</h2>
      </div>
      <div className="card-body">
        <div className="text-center">
          {sealPhoto ? (
            <div className="space-y-4">
              <div 
                className="relative inline-block cursor-pointer group"
                onClick={() => setViewerOpen(true)}
              >
                <img 
                  src={sealPhoto} 
                  alt="Seal" 
                  className="w-32 h-32 object-cover rounded-lg border-2 border-slate-200 group-hover:border-crown-navy transition-colors"
                />
                <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  {language === 'es' ? 'Foto del sello capturada' : 'Seal photo captured'}
                </p>
                <button
                  onClick={() => setCameraOpen(true)}
                  className="btn-secondary text-sm"
                >
                  <Camera className="w-4 h-4" />
                  {language === 'es' ? 'Tomar otra foto' : 'Take another photo'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                <Camera className="w-8 h-8 text-slate-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  {language === 'es' ? 'Se requiere foto del sello' : 'Seal photo required'}
                </p>
                <button
                  onClick={() => setCameraOpen(true)}
                  className="btn-gold"
                >
                  <Camera className="w-4 h-4" />
                  {language === 'es' ? 'Tomar foto del sello' : 'Take seal photo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onConfirm={handlePhotoConfirm}
        title={language === 'es' ? 'Foto del Sello' : 'Seal Photo'}
      />

      <PhotoViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        photo={sealPhoto}
        title={language === 'es' ? 'Foto del Sello' : 'Seal Photo'}
      />
    </section>
  )
}
