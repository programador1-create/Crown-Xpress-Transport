import { useEffect, useState } from 'react'
import { MapPin, Calendar, User, Tag, Lock, Package, Search, CheckCircle, XCircle, Loader2, Truck, Box, PackageX } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { useAuth } from '../context/AuthContext'
import { searchOperator } from '../utils/api'
import { INSPECTION_TYPES } from '../data/inspectionPoints'

const YARDS = [
  { id: 1, name: 'Yard A - Laredo' },
  { id: 2, name: 'Yard B - El Paso' },
  { id: 3, name: 'Yard C - Dallas' },
  { id: 4, name: 'Yard D - Houston' },
  { id: 5, name: 'Yard E - San Antonio' },
]

export default function UnitInfoEnhanced({ onContainerChange, onSealChange, onLockChange, onInspectionTypeChange }) {
  const { t, language } = useLanguage()
  const { unitInfo, updateUnitInfo } = useInspection()
  const { user } = useAuth()
  const [inspectionType, setInspectionType] = useState(null) // null = not selected yet
  const [hasContainer, setHasContainer] = useState(false)
  const [hasSeal, setHasSeal] = useState(false)
  const [hasLock, setHasLock] = useState(false)
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [operatorSearching, setOperatorSearching] = useState(false)
  const [operatorFound, setOperatorFound] = useState(null)
  const [operatorError, setOperatorError] = useState(null)

  // Handle inspection type selection
  const handleInspectionTypeChange = (type) => {
    setInspectionType(type)
    updateUnitInfo('inspectionType', type)
    
    const typeConfig = INSPECTION_TYPES[type]
    
    // Reset fields based on type
    if (type === 'BOBTAIL') {
      // Bobtail: No container, no seal, no lock
      setHasContainer(false)
      setHasSeal(false)
      setHasLock(false)
      updateUnitInfo('containerNumber', '')
      updateUnitInfo('sealNumber', '')
      updateUnitInfo('lockNumber', '')
      if (onContainerChange) onContainerChange(false)
      if (onSealChange) onSealChange(false)
      if (onLockChange) onLockChange(false)
    } else if (type === 'EMPTY') {
      // Empty: Has container option, no seal, no lock
      setHasContainer(false)
      setHasSeal(false)
      setHasLock(false)
      updateUnitInfo('sealNumber', '')
      updateUnitInfo('lockNumber', '')
      if (onSealChange) onSealChange(false)
      if (onLockChange) onLockChange(false)
    } else if (type === 'LOADED') {
      // Loaded: Has container option, requires seal OR lock
      setHasContainer(false)
      setHasSeal(true) // Default to seal
      setHasLock(false)
      if (onSealChange) onSealChange(true)
    }
    
    if (onInspectionTypeChange) onInspectionTypeChange(type)
  }

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
    // Guard name is auto-assigned from logged in user
    updateUnitInfo('guardName', user?.full_name || '')
    updateUnitInfo('location', user?.location_id ? YARDS.find(y => y.id === user.location_id)?.name || '' : '')
  }, [user, updateUnitInfo])

  // Search operator by employee number
  const handleSearchOperator = async () => {
    console.log('Searching for operator:', employeeNumber)
    
    if (!employeeNumber || employeeNumber.length < 3) {
      setOperatorError(language === 'es' ? 'Ingrese número de empleado' : 'Enter employee number')
      return
    }
    
    setOperatorSearching(true)
    setOperatorError(null)
    setOperatorFound(null)
    
    try {
      console.log('Calling searchOperator API...')
      const result = await searchOperator(employeeNumber)
      console.log('API result:', result)
      if (result.success && result.operator) {
        setOperatorFound(result.operator)
        updateUnitInfo('driverName', result.operator.fullName)
        updateUnitInfo('employeeNumber', result.operator.employeeNumber)
      }
    } catch (err) {
      console.error('Search operator error:', err)
      setOperatorError(language === 'es' ? 'Operador no encontrado' : 'Operator not found')
      updateUnitInfo('driverName', '')
    } finally {
      setOperatorSearching(false)
    }
  }

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

  // If no inspection type selected, show type selector
  if (!inspectionType) {
    return (
      <section className="card animate-slide-up">
        <div className="card-header flex items-center gap-3">
          <Tag className="w-5 h-5 text-crown-gold" />
          <h2 className="font-bold tracking-wide uppercase text-sm">
            {language === 'es' ? 'TIPO DE INSPECCIÓN' : 'INSPECTION TYPE'}
          </h2>
        </div>
        <div className="card-body">
          <p className="text-sm text-slate-600 mb-4">
            {language === 'es' 
              ? 'Seleccione el tipo de inspección para continuar:' 
              : 'Select the inspection type to continue:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* LOADED */}
            <button
              type="button"
              onClick={() => handleInspectionTypeChange('LOADED')}
              className="p-6 border-2 border-slate-200 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-3 group"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <Box className="w-8 h-8 text-emerald-600" />
              </div>
              <span className="font-bold text-lg text-slate-800">
                {language === 'es' ? 'CARGADO' : 'LOADED'}
              </span>
              <span className="text-xs text-slate-500 text-center">
                {language === 'es' 
                  ? 'Trailer con carga. Requiere sello O candado.' 
                  : 'Trailer with cargo. Requires seal OR lock.'}
              </span>
              <span className="text-xs font-semibold text-emerald-600">20 {language === 'es' ? 'puntos' : 'points'}</span>
            </button>

            {/* EMPTY */}
            <button
              type="button"
              onClick={() => handleInspectionTypeChange('EMPTY')}
              className="p-6 border-2 border-slate-200 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-3 group"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <PackageX className="w-8 h-8 text-amber-600" />
              </div>
              <span className="font-bold text-lg text-slate-800">
                {language === 'es' ? 'VACÍO' : 'EMPTY'}
              </span>
              <span className="text-xs text-slate-500 text-center">
                {language === 'es' 
                  ? 'Trailer sin carga. Sin sello ni candado.' 
                  : 'Empty trailer. No seal or lock.'}
              </span>
              <span className="text-xs font-semibold text-amber-600">17 {language === 'es' ? 'puntos' : 'points'}</span>
            </button>

            {/* BOBTAIL */}
            <button
              type="button"
              onClick={() => handleInspectionTypeChange('BOBTAIL')}
              className="p-6 border-2 border-slate-200 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-3 group"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
              <span className="font-bold text-lg text-slate-800">
                {language === 'es' ? 'BOTADO' : 'BOBTAIL'}
              </span>
              <span className="text-xs text-slate-500 text-center">
                {language === 'es' 
                  ? 'Solo tractor. Sin trailer ni contenedor.' 
                  : 'Tractor only. No trailer or container.'}
              </span>
              <span className="text-xs font-semibold text-blue-600">10 {language === 'es' ? 'puntos' : 'points'}</span>
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="card animate-slide-up">
      <div className="card-header flex items-center gap-3">
        <Tag className="w-5 h-5 text-crown-gold" />
        <h2 className="font-bold tracking-wide uppercase text-sm">{t('unitInfo')}</h2>
        {/* Show selected type badge */}
        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
          inspectionType === 'LOADED' ? 'bg-emerald-100 text-emerald-700' :
          inspectionType === 'EMPTY' ? 'bg-amber-100 text-amber-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {INSPECTION_TYPES[inspectionType]?.[language] || inspectionType}
        </span>
        <button
          type="button"
          onClick={() => setInspectionType(null)}
          className="text-xs text-slate-500 hover:text-slate-700 underline"
        >
          {language === 'es' ? 'Cambiar' : 'Change'}
        </button>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Trailer Number */}
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>{inspectionType === 'BOBTAIL' ? (language === 'es' ? 'Número de Tractor' : 'Tractor Number') : t('trailerNumber')} <span className="text-rose-500">*</span></span>
              {getFieldIcon('trailerNumber')}
            </label>
            <input
              type="text"
              value={unitInfo.trailerNumber || ''}
              onChange={e => update('trailerNumber', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${validateField('trailerNumber')}`}
              placeholder={inspectionType === 'BOBTAIL' ? (language === 'es' ? 'EJ: TR-12345' : 'EX: TR-12345') : (language === 'es' ? 'EJ: T-12345' : 'EX: T-12345')}
              required
            />
          </div>

          {/* Seal Checkbox and Number - Only for LOADED */}
          {inspectionType === 'LOADED' && (
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase">
                {language === 'es' ? '¿TIENE SELLO DE SEGURIDAD?' : 'HAS SECURITY SEAL?'}
                {!hasSeal && !hasLock && <span className="text-rose-500 ml-2 text-xs">(REQUIERE SELLO O CANDADO)</span>}
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
                <label htmlFor="hasSeal" className="text-sm text-slate-600 cursor-pointer uppercase">
                  {language === 'es' ? 'SÍ, TIENE SELLO' : 'YES, HAS SEAL'}
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
          )}

          {/* Lock Checkbox and Number - Only for LOADED */}
          {inspectionType === 'LOADED' && (
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase">
                {language === 'es' ? '¿TIENE CANDADO?' : 'HAS LOCK?'}
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
                <label htmlFor="hasLock" className="text-sm text-slate-600 cursor-pointer uppercase">
                  {language === 'es' ? 'SÍ, TIENE CANDADO' : 'YES, HAS LOCK'}
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
          )}

          {/* Operator - Employee Number Search */}
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center justify-between uppercase">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {language === 'es' ? 'NO. EMPLEADO OPERADOR' : 'OPERATOR EMPLOYEE #'} <span className="text-rose-500">*</span>
              </span>
              {operatorFound ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : operatorError ? (
                <XCircle className="w-4 h-4 text-rose-500" />
              ) : null}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={employeeNumber}
                onChange={e => {
                  setEmployeeNumber(e.target.value.toUpperCase())
                  setOperatorFound(null)
                  setOperatorError(null)
                }}
                onKeyDown={e => e.key === 'Enter' && handleSearchOperator()}
                className={`flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 uppercase transition-colors ${
                  operatorFound ? 'border-emerald-400 bg-emerald-50' : 
                  operatorError ? 'border-rose-400 bg-rose-50' : 
                  'border-slate-200 focus:border-crown-navy'
                }`}
                placeholder={language === 'es' ? 'EJ: EMP001' : 'E.G.: EMP001'}
              />
              <button
                type="button"
                onClick={handleSearchOperator}
                disabled={operatorSearching}
                className="px-3 py-2 bg-crown-navy text-white rounded-lg hover:bg-crown-navy/90 disabled:opacity-50 flex items-center gap-1"
              >
                {operatorSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>
            {operatorFound && (
              <p className="text-xs text-emerald-600 mt-1 font-semibold">
                ✓ {operatorFound.fullName}
              </p>
            )}
            {operatorError && (
              <p className="text-xs text-rose-600 mt-1">
                {operatorError}
              </p>
            )}
          </div>

          {/* Operator Name (readonly - filled from search) */}
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
              readOnly
              className={`w-full px-3 py-2 border-2 rounded-lg bg-slate-100 cursor-not-allowed uppercase transition-colors ${
                unitInfo.driverName ? 'border-emerald-400' : 'border-slate-200'
              }`}
              placeholder={language === 'es' ? 'BUSCAR POR NO. EMPLEADO' : 'SEARCH BY EMPLOYEE #'}
            />
          </div>

          {/* Date - readonly, auto-set to today */}
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
              readOnly
              className={`w-full px-3 py-2 border-2 rounded-lg bg-slate-100 cursor-not-allowed transition-colors ${validateField('inspectionDate')}`}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              {language === 'es' ? 'Fecha automática del día actual' : 'Automatic date of current day'}
            </p>
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
