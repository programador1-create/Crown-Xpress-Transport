import { useEffect, useRef, useState } from 'react'
import { Camera, X, RotateCw, Check, AlertTriangle, Loader2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { validatePhoto, validationReasons } from '../utils/photoValidator'

export default function CameraModal({ open, onClose, onConfirm, title }) {
  const { t, language } = useLanguage()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  
  const [error, setError] = useState(null)
  const [captured, setCaptured] = useState(null)
  const [validating, setValidating] = useState(false)
  const [validation, setValidation] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')

  useEffect(() => {
    if (!open) return
    startCamera()
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facingMode])

  const startCamera = async () => {
    setError(null)
    setCaptured(null)
    setValidation(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError(t('cameraError'))
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const handleCapture = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCaptured(dataUrl)
    
    // Validate
    setValidating(true)
    const result = await validatePhoto(dataUrl)
    setValidation(result)
    setValidating(false)
  }

  const handleRetake = () => {
    setCaptured(null)
    setValidation(null)
  }

  const handleConfirm = () => {
    if (!captured || !validation?.valid) return
    onConfirm(captured)
    handleClose()
  }

  const handleClose = () => {
    stopCamera()
    setCaptured(null)
    setValidation(null)
    onClose()
  }

  const switchCamera = () => {
    stopCamera()
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-1 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[100vh] sm:max-h-[95vh] flex flex-col overflow-hidden shadow-crown-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-crown-navy-dark to-crown-navy text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-crown-gold" />
            <h3 className="font-bold">{title || t('capturePhoto')}</h3>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera/Preview area */}
        <div className="relative bg-black aspect-[4/3] sm:aspect-[16/9] flex items-center justify-center flex-1 min-h-0">
          {error ? (
            <div className="text-white text-center p-6">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-400" />
              <p>{error}</p>
            </div>
          ) : captured ? (
            <img src={captured} alt="captured" className="w-full h-full object-contain" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Crosshair overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-2/3 h-2/3 border-2 border-crown-gold/60 rounded-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-6 bg-crown-gold/70" />
                    <div className="absolute w-6 h-1 bg-crown-gold/70" />
                  </div>
                </div>
              </div>
              <button
                onClick={switchCamera}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition"
                title="Switch camera"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              {/* Floating capture button for mobile/tablet */}
              <button
                onClick={handleCapture}
                disabled={!!error}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-crown-gold hover:bg-crown-gold/90 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center sm:hidden"
              >
                <Camera className="w-6 h-6" />
              </button>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Validation feedback */}
        {captured && (
          <div className="px-5 py-3 border-t border-slate-100">
            {validating ? (
              <div className="flex items-center gap-2 text-crown-navy">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">{t('photoValidating')}</span>
              </div>
            ) : validation?.valid ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {language === 'es' ? 'Foto válida' : 'Valid photo'} 
                  <span className="text-emerald-600 ml-1">
                    ({Math.round(validation.score * 100)}%)
                  </span>
                </span>
              </div>
            ) : validation ? (
              <div className="flex items-start gap-2 text-rose-700 bg-rose-50 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold">{t('invalidPhoto')}</div>
                  <div className="text-xs mt-0.5">
                    {validationReasons[language][validation.reason] || t('invalidPhotoMessage')}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Actions */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 bg-slate-50 border-t border-slate-100 flex gap-2 flex-wrap">
          {!captured ? (
            <>
              <button onClick={handleClose} className="btn-secondary text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2">
                <X className="w-4 h-4" /> <span className="hidden sm:inline">{t('cancel')}</span>
              </button>
              <button onClick={handleCapture} disabled={!!error} className="btn-gold ml-auto text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2 hidden sm:flex">
                <Camera className="w-4 h-4" /> {t('capture')}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleRetake} className="btn-secondary text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2">
                <RotateCw className="w-4 h-4" /> <span className="hidden sm:inline">{t('retake')}</span>
              </button>
              <button 
                onClick={handleConfirm} 
                disabled={validating || !validation?.valid} 
                className="btn-success ml-auto text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
              >
                <Check className="w-4 h-4" /> {t('confirm')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
