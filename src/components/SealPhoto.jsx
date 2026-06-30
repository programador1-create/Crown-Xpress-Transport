import { useState, useMemo } from 'react'
import { Lock, Camera, Eye, Check } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { getApplicablePoints } from '../data/inspectionPoints'
import CameraModal from './CameraModal'
import PhotoViewerModal from './PhotoViewerModal'

export default function SealPhoto() {
  const { t } = useLanguage()
  const { sealPhoto, setSealPhoto, unitInfo, completedCount } = useInspection()
  const [cameraOpen, setCameraOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)

  // Calculate applicable points based on inspection type
  const applicablePoints = useMemo(() => {
    return getApplicablePoints(unitInfo?.inspectionType)
  }, [unitInfo?.inspectionType])
  
  const totalPoints = applicablePoints.length
  const allPointsCompleted = completedCount === totalPoints

  // Hide seal photo for EMPTY, BOBTAIL, and FLATBED inspections
  const inspectionType = unitInfo?.inspectionType
  if (inspectionType === 'EMPTY' || inspectionType === 'BOBTAIL' || inspectionType === 'FLATBED') {
    return null
  }
  
  // Hide seal photo section until all points are completed
  if (!allPointsCompleted) {
    return null
  }

  return (
    <>
      <section className="card animate-slide-up">
        <div className="card-header flex items-center gap-3">
          <Lock className="w-5 h-5 text-crown-gold" />
          <h2 className="font-bold tracking-wide uppercase text-sm">{t('sealPhotoTitle')}</h2>
        </div>
        <div className="card-body">
          <p className="text-sm text-slate-500 mb-4">{t('sealPhotoDesc')}</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div
              onClick={() => sealPhoto ? setViewerOpen(true) : setCameraOpen(true)}
              className={`relative w-32 h-32 rounded-xl border-2 cursor-pointer overflow-hidden flex items-center justify-center transition-all ${
                sealPhoto
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-dashed border-crown-navy/30 bg-slate-50 hover:border-crown-gold hover:bg-crown-gold/5'
              }`}
            >
              {sealPhoto ? (
                <>
                  <img src={sealPhoto} alt="seal" className="w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                </>
              ) : (
                <div className="text-center text-crown-navy/60">
                  <Lock className="w-8 h-8 mx-auto mb-1" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">No photo</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {sealPhoto ? (
                <>
                  <button onClick={() => setViewerOpen(true)} className="btn-secondary">
                    <Eye className="w-4 h-4" /> {t('viewPhoto')}
                  </button>
                  <button onClick={() => setCameraOpen(true)} className="btn-gold">
                    <Camera className="w-4 h-4" /> {t('retakePhoto')}
                  </button>
                </>
              ) : (
                <button onClick={() => setCameraOpen(true)} className="btn-gold">
                  <Camera className="w-4 h-4" /> {t('capturePhoto')}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onConfirm={setSealPhoto}
        title={t('sealPhotoTitle')}
      />
      <PhotoViewerModal
        open={viewerOpen}
        photo={sealPhoto}
        onClose={() => setViewerOpen(false)}
        onRetake={() => { setViewerOpen(false); setCameraOpen(true) }}
        title={t('sealPhotoTitle')}
      />
    </>
  )
}
