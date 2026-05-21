import { useEffect, useRef, useState } from 'react'
import { Eraser, Check } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function SignatureBox({ value, onChange, label, name, onNameChange, namePlaceholder, accent = 'navy', readOnly = false, optional = false, optionalLabel }) {
  const { t } = useLanguage()
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const [hasSigned, setHasSigned] = useState(!!value)

  const accentColor = accent === 'gold' ? 'crown-gold' : 'crown-navy'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.2
    ctx.strokeStyle = '#0d3b54'
    ctxRef.current = ctx

    if (value) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height)
        setHasSigned(true)
      }
      img.src = value
    }
  }, [])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const start = (e) => {
    if (readOnly) return
    e.preventDefault()
    isDrawingRef.current = true
    lastPosRef.current = getPos(e)
  }

  const draw = (e) => {
    if (!isDrawingRef.current || readOnly) return
    e.preventDefault()
    const ctx = ctxRef.current
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPosRef.current = pos
    if (!hasSigned) setHasSigned(true)
  }

  const end = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onChange?.(dataUrl)
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    const rect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)
    setHasSigned(false)
    onChange?.(null)
  }

  return (
    <div className={`rounded-xl border-2 overflow-hidden bg-white ${hasSigned ? `border-${accentColor}` : 'border-slate-200'}`}>
      <div className={`flex items-center justify-between px-4 py-2 bg-gradient-to-r ${
        accent === 'gold'
          ? 'from-crown-gold-dark to-crown-gold'
          : 'from-crown-navy-dark to-crown-navy'
      } text-white`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{label}</span>
          {optional && (
            <span className="text-[10px] uppercase tracking-wider opacity-80 bg-white/20 px-2 py-0.5 rounded">
              {optionalLabel}
            </span>
          )}
          {hasSigned && <Check className="w-4 h-4 text-emerald-300" />}
        </div>
        <button
          type="button"
          onClick={clear}
          disabled={readOnly}
          className="text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-30"
        >
          <Eraser className="w-3.5 h-3.5" /> {t('clear')}
        </button>
      </div>

      <div className="p-3 space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange?.(e.target.value)}
          placeholder={namePlaceholder}
          className="input"
          disabled={readOnly}
        />
        <div className="relative bg-slate-50 rounded-lg border border-slate-200">
          {!hasSigned && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-300 text-sm italic">{t('sign')}</span>
            </div>
          )}
          <canvas
            ref={canvasRef}
            onMouseDown={start}
            onMouseMove={draw}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={draw}
            onTouchEnd={end}
            className="w-full h-32 sm:h-36 cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
