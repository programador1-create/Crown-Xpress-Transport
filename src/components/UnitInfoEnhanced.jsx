import { useEffect, useState } from 'react'
import { MapPin, Calendar, User, Tag, Lock, Package } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { useAuth } from '../context/AuthContext'

const YARDS = [
  { id: 1, name: 'Yard A - Laredo' },
  { id: 2, name: 'Yard B - El Paso' },
  { id: 3, name: 'Yard C - Dallas' },
  { id: 4, name: 'Yard D - Houston' },
  { id: 5, name: 'Yard E - San Antonio' },
]

export default function UnitInfoEnhanced({ onContainerChange, onSealChange, onLockChange }) {
  const { t, language } = useLanguage()
  const { unitInfo, updateUnitInfo } = useInspection()
  const { user } = useAuth()
  const [hasContainer, setHasContainer] = useState(false)
  const [hasSeal, setHasSeal] = useState(true)
  const [hasLock, setHasLock] = useState(false)

  // Notify parent when checkbox states change
  const handleContainerChange = (checked) => {
    setHasContainer(checked)
    if (onContainerChange) onContainerChange(checked)
  }

  const handleSealChange = (checked) => {
    setHasSeal(checked)
    if (onSealChange) onSealChange(checked)
  }

  const handleLockChange = (checked) => {
    setHasLock(checked)
    if (onLockChange) onLockChange(checked)
  }

  // Auto-fill date and guard name on mount
  useEffect(() => {
    // Set today's date in YYYY-MM-DD format for date input
    const today = new Date().toISOString().slice(0, 10)
    updateUnitInfo('inspectionDate', today)
    updateUnitInfo('driverName', user?.full_name || '')
    updateUnitInfo('location', user?.location_id ? YARDS.find(y => y.id === user.location_id)?.name || '' : '')
  }, [user, updateUnitInfo])

  const update = (field, value) => {
    updateUnitInfo(field, value)
  }

  const validateField = (field) => {
    // Optional fields based on checkboxes
    if (field === 'containerNumber' && !hasContainer) {
      return 'border-slate-200 focus:border-crown-navy'
    }
    if (field === 'sealNumber' && !hasSeal) {
      return 'border-slate-200 focus:border-crown-navy'
    }
    if (field === 'lockNumber' && !hasLock) {
      return 'border-slate-200 focus:border-crown-navy'
    }
    // Check if field has value
    if (!unitInfo[field] || unitInfo[field].trim() === '') {
      return 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-200'
    }
    return 'border-emerald-400 bg-emerald-50 focus:border-emerald-500 focus:ring-emerald-200'
  }
  
  const getFieldIcon = (field) => {
    // Optional fields based on checkboxes
    if (field === 'containerNumber' && !hasContainer) return null
    if (field === 'sealNumber' && !hasSeal) return null
    if (field === 'lockNumber' && !hasLock) return null
    
    if (!unitInfo[field] || unitInfo[field].trim() === '') {
      return <span className="text-rose-500 text-xs font-bold">✗</span>
    }
    return <span className="text-emerald-500 text-xs font-bold">✓</span>
  }

  return (
    <section className="card animate-slide-up">
      <div className="card-header flex items-center gap-3">
        <Tag className="w-5 h-5 text-crown-gold" />
        <h2 className="font-bold tracking-wide uppercase text-sm">{t('unitInfo')}</h2>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Trailer Number */}
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>{t('trailerNumber')} <span className="text-rose-500">*</span></span>
              {getFieldIcon('trailerNumber')}
            </label>
            <input
              type="text"
              value={unitInfo.trailerNumber || ''}
              onChange={e => update('trailerNumber', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${validateField('trailerNumber')}`}
              placeholder={language === 'es' ? 'EJ: T-12345' : 'EX: T-12345'}
              required
            />
          </div>

          {/* Container Checkbox and Number */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {language === 'es' ? '¿Lleva contenedor?' : 'Has container?'}
            </label>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="hasContainer"
                checked={hasContainer}
                onChange={(e) => {
                  handleContainerChange(e.target.checked)
                  if (!e.target.checked) {
                    update('containerNumber', '')
                  }
                }}
                className="w-4 h-4 text-crown-gold border-slate-300 rounded focus:ring-crown-gold focus:ring-2"
              />
              <label htmlFor="hasContainer" className="text-sm text-slate-600 cursor-pointer">
                {language === 'es' ? 'Sí, lleva contenedor' : 'Yes, has container'}
              </label>
            </div>
            {hasContainer && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {language === 'es' ? 'NÚMERO DE CONTENEDOR' : 'CONTAINER NUMBER'} <span className="text-rose-500">*</span>
                  </span>
                  {getFieldIcon('containerNumber')}
                </label>
                <input
                  type="text"
                  value={unitInfo.containerNumber || ''}
                  onChange={e => update('containerNumber', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${validateField('containerNumber')}`}
                  placeholder={language === 'es' ? 'EJ: MSKU1234567' : 'EX: MSKU1234567'}
                  required={hasContainer}
                />
              </div>
            )}
          </div>

          {/* Seal Checkbox and Number */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {language === 'es' ? '¿Tiene sello de seguridad?' : 'Has security seal?'}
            </label>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="hasSeal"
                checked={hasSeal}
                onChange={(e) => {
                  handleSealChange(e.target.checked)
                  if (!e.target.checked) {
                    update('sealNumber', '')
                  }
                }}
                className="w-4 h-4 text-crown-gold border-slate-300 rounded focus:ring-crown-gold focus:ring-2"
              />
              <label htmlFor="hasSeal" className="text-sm text-slate-600 cursor-pointer">
                {language === 'es' ? 'Sí, tiene sello' : 'Yes, has seal'}
              </label>
            </div>
            {hasSeal && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {t('sealNumber').toUpperCase()} <span className="text-rose-500">*</span>
                  </span>
                  {getFieldIcon('sealNumber')}
                </label>
                <input
                  type="text"
                  value={unitInfo.sealNumber || ''}
                  onChange={e => update('sealNumber', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${validateField('sealNumber')}`}
                  placeholder={language === 'es' ? 'EJ: S-98765' : 'EX: S-98765'}
                  required={hasSeal}
                />
              </div>
            )}
          </div>

          {/* Lock Checkbox and Number */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {language === 'es' ? '¿Tiene candado?' : 'Has lock?'}
            </label>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="hasLock"
                checked={hasLock}
                onChange={(e) => {
                  handleLockChange(e.target.checked)
                  if (!e.target.checked) {
                    update('lockNumber', '')
                  }
                }}
                className="w-4 h-4 text-crown-gold border-slate-300 rounded focus:ring-crown-gold focus:ring-2"
              />
              <label htmlFor="hasLock" className="text-sm text-slate-600 cursor-pointer">
                {language === 'es' ? 'Sí, tiene candado' : 'Yes, has lock'}
              </label>
            </div>
            {hasLock && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {language === 'es' ? 'NÚMERO DE CANDADO' : 'LOCK NUMBER'} <span className="text-rose-500">*</span>
                  </span>
                  {getFieldIcon('lockNumber')}
                </label>
                <input
                  type="text"
                  value={unitInfo.lockNumber || ''}
                  onChange={e => update('lockNumber', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${validateField('lockNumber')}`}
                  placeholder={language === 'es' ? 'EJ: L-54321' : 'EX: L-54321'}
                  required={hasLock}
                />
              </div>
            )}
          </div>

          {/* Operator Name */}
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between uppercase">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {t('driverName')} <span className="text-rose-500">*</span>
              </span>
              {getFieldIcon('driverName')}
            </label>
            <input
              type="text"
              value={unitInfo.driverName || ''}
              onChange={e => update('driverName', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 uppercase transition-colors ${validateField('driverName')}`}
              placeholder={language === 'es' ? 'NOMBRE COMPLETO DEL OPERADOR' : 'OPERATOR FULL NAME'}
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('date').toUpperCase()} <span className="text-rose-500">*</span>
              </span>
              {getFieldIcon('inspectionDate')}
            </label>
            <input
              type="date"
              value={unitInfo.inspectionDate || ''}
              onChange={e => update('inspectionDate', e.target.value)}
              className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${validateField('inspectionDate')}`}
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {language === 'es' ? 'UBICACIÓN (YARDA)' : 'LOCATION'} <span className="text-rose-500">*</span>
              </span>
              {getFieldIcon('location')}
            </label>
            <select
              value={unitInfo.location || ''}
              onChange={e => update('location', e.target.value)}
              className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${validateField('location')}`}
              required
            >
              <option value="">{language === 'es' ? 'SELECCIONE...' : 'SELECT...'}</option>
              {YARDS.map(yard => (
                <option key={yard.id} value={yard.name}>{yard.name.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Guard Name (readonly) */}
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {language === 'es' ? 'GUARDIA' : 'GUARD'}
              </span>
              <span className="text-emerald-500 text-xs font-bold">✓</span>
            </label>
            <input
              type="text"
              value={(unitInfo.guardName || '').toUpperCase()}
              readOnly
              className="w-full px-3 py-2 border-2 border-emerald-400 bg-emerald-50 rounded-lg text-slate-700 uppercase"
              placeholder={language === 'es' ? 'ASIGNADO AUTOMÁTICAMENTE' : 'AUTO-ASSIGNED'}
            />
          </div>
        </div>

      </div>
    </section>
  )
}
