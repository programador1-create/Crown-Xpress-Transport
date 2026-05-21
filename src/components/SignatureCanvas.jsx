import { useRef, useEffect, useState } from 'react'
import { X, RotateCcw, Check } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function SignatureCanvas({ open, onClose, onSave, title, signerName }) {
  const { t, language } = useLanguage()
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    if (!open || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set drawing styles
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Clear canvas
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    let drawing = false
    let lastX = 0
    let lastY = 0

    const startDrawing = (e) => {
      drawing = true
      const rect = canvas.getBoundingClientRect()
      lastX = e.clientX - rect.left
      lastY = e.clientY - rect.top
      setIsEmpty(false)
    }

    const draw = (e) => {
      if (!drawing) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      ctx.beginPath()
      ctx.moveTo(lastX, lastY)
      ctx.lineTo(x, y)
      ctx.stroke()

      lastX = x
      lastY = y
    }

    const stopDrawing = () => {
      drawing = false
    }

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDrawing)
    canvas.addEventListener('mouseout', stopDrawing)

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      canvas.dispatchEvent(mouseEvent)
    })

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      canvas.dispatchEvent(mouseEvent)
    })

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
      const mouseEvent = new MouseEvent('mouseup', {})
      canvas.dispatchEvent(mouseEvent)
    })

    return () => {
      canvas.removeEventListener('mousedown', startDrawing)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stopDrawing)
      canvas.removeEventListener('mouseout', stopDrawing)
      canvas.removeEventListener('touchstart', () => {})
      canvas.removeEventListener('touchmove', () => {})
      canvas.removeEventListener('touchend', () => {})
    }
  }, [open])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return

    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col overflow-hidden shadow-crown-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-crown-navy-dark to-crown-navy text-white">
          <div>
            <h3 className="font-bold">{title}</h3>
            {signerName && (
              <p className="text-xs text-white/70">{signerName}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas */}
        <div className="p-5 bg-slate-50">
          <div className="bg-white rounded-lg border-2 border-slate-300 overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-48 cursor-crosshair touch-none"
              style={{ touchAction: 'none' }}
            />
          </div>
          
          {/* Instructions */}
          <p className="text-xs text-slate-600 mt-2 text-center">
            {language === 'es' 
              ? 'Firme en el área de arriba con su dedo o mouse' 
              : 'Sign in the area above with your finger or mouse'
            }
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 bg-white border-t border-slate-100 flex gap-3">
          <button
            onClick={clearCanvas}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {language === 'es' ? 'Limpiar' : 'Clear'}
          </button>
          
          <div className="flex-1" />
          
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          
          <button
            onClick={handleSave}
            disabled={isEmpty}
            className="btn-gold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            {language === 'es' ? 'Guardar Firma' : 'Save Signature'}
          </button>
        </div>
      </div>
    </div>
  )
}
