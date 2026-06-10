import { useState, useEffect } from 'react'
import { X, Delete, Check, Trash2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

/**
 * NumericKeypad - Simple calculator-style keypad for entering numbers
 * Designed for iPad use without needing the on-screen keyboard
 * Keys: 1234567890 + - * /
 */
export default function NumericKeypad({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  initialValue = '',
  maxLength = 20
}) {
  const { language } = useLanguage()
  const [value, setValue] = useState('')

  // Reset value when modal opens with new initialValue
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue || '')
      // Block body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll when modal closes
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, initialValue])

  if (!isOpen) return null

  const handleKeyPress = (key) => {
    if (value.length < maxLength) {
      setValue(prev => prev + key)
    }
  }

  const handleBackspace = () => {
    setValue(prev => prev.slice(0, -1))
  }

  const handleClear = () => {
    setValue('')
  }

  const handleConfirm = () => {
    onConfirm(value.toUpperCase())
    setValue('') // Clear value after confirm
    onClose()
  }

  const handleClose = () => {
    setValue('') // Clear value when closing
    onClose()
  }

  // Prevent touch events from propagating to background
  const handleTouchMove = (e) => {
    e.stopPropagation()
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onTouchMove={handleTouchMove}
      style={{ touchAction: 'none' }}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-crown-navy to-crown-navy/90 px-5 py-4 text-white flex items-center justify-between">
          <h3 className="font-bold text-lg uppercase">{title}</h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="bg-white border-2 border-slate-300 rounded-xl px-4 py-4 min-h-[64px] flex items-center justify-between">
            <span className="text-3xl font-mono font-bold text-slate-800 tracking-wider">
              {value || <span className="text-slate-300">---</span>}
            </span>
            <button
              onClick={handleBackspace}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            >
              <Delete className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Calculator Keypad */}
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {/* Row 1 */}
            <button onClick={() => handleKeyPress('7')} className="p-5 text-2xl font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors">7</button>
            <button onClick={() => handleKeyPress('8')} className="p-5 text-2xl font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors">8</button>
            <button onClick={() => handleKeyPress('9')} className="p-5 text-2xl font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors">9</button>
            <button onClick={() => handleKeyPress('/')} className="p-5 text-2xl font-bold bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-700 rounded-xl transition-colors">/</button>
            
            {/* Row 2 */}
            <button onClick={() => handleKeyPress('4')} className="p-5 text-2xl font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors">4</button>
            <button onClick={() => handleKeyPress('5')} className="p-5 text-2xl font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors">5</button>
            <button onClick={() => handleKeyPress('6')} className="p-5 text-2xl font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors">6</button>
            <button onClick={() => handleKeyPress('*')} className="p-5 text-2xl font-bold bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-700 rounded-xl transition-colors">×</button>
            
            {/* Row 3 */}
            <button onClick={() => handleKeyPress('1')} className="p-5 text-2xl font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors">1</button>
            <button onClick={() => handleKeyPress('2')} className="p-5 text-2xl font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors">2</button>
            <button onClick={() => handleKeyPress('3')} className="p-5 text-2xl font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors">3</button>
            <button onClick={() => handleKeyPress('-')} className="p-5 text-2xl font-bold bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-700 rounded-xl transition-colors">−</button>
            
            {/* Row 4 */}
            <button onClick={() => handleKeyPress('0')} className="p-5 text-2xl font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors">0</button>
            <button onClick={handleClear} className="p-5 font-bold bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white rounded-xl transition-colors flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </button>
            <button onClick={handleConfirm} className="col-span-2 p-5 font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl transition-colors flex items-center justify-center gap-2 text-xl">
              <Check className="w-6 h-6" />
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
