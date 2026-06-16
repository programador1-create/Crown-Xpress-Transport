import { useEffect, useState } from 'react'
import { MapPin, User, Tag, Lock, Package, Search, CheckCircle, XCircle, Loader2, Truck, Box, PackageX, Keyboard } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { useAuth } from '../context/AuthContext'
import { searchOperator, searchOperatorsByName, listOperators } from '../utils/api'
import { INSPECTION_TYPES } from '../data/inspectionPoints'
import NumericKeypad from './NumericKeypad'

const YARDS = [
  { id: 1, name: 'Yard A - Laredo' },
  { id: 2, name: 'Yard B - El Paso' },
  { id: 3, name: 'Yard C - Dallas' },
  { id: 4, name: 'Yard D - Houston' },
  { id: 5, name: 'Yard E - San Antonio' },
]

// Trailer types with sizes
const TRAILER_TYPES = {
  BOX: {
    es: 'CAJA',
    en: 'BOX',
    icon: 'box',
    sizes: ['53', '40', '20']
  },
  CONTAINER: {
    es: 'CONTENEDOR',
    en: 'CONTAINER',
    icon: 'container',
    sizes: ['53', '40', '20']
  },
  FLATBED: {
    es: 'PLATAFORMA',
    en: 'FLATBED',
    icon: 'flatbed',
    sizes: ['53', '40']
  },
  OTHER: {
    es: 'OTROS',
    en: 'OTHER',
    icon: 'other',
    sizes: ['53', '48', '40', '20']
  }
}

// Equipment owner options
const EQUIPMENT_OWNERS = {
  CROWN: {
    es: 'CROWN',
    en: 'CROWN',
    description: { es: 'Equipo propiedad de Crown Xpress', en: 'Crown Xpress owned equipment' }
  },
  CUSTOMER: {
    es: 'CLIENTE',
    en: 'CUSTOMER',
    description: { es: 'Equipo propiedad del cliente', en: 'Customer owned equipment' }
  }
}

// Crown fleet options by trailer type
const CROWN_FLEETS_BOX = {
  CXT: { name: 'CXT', description: { es: 'Crown Xpress Transport', en: 'Crown Xpress Transport' } },
  RBX: { name: 'RBX', description: { es: 'RBX Fleet', en: 'RBX Fleet' } },
  ABBA: { name: 'ABBA', description: { es: 'ABBA Fleet', en: 'ABBA Fleet' } },
  JGB: { name: 'JGB', description: { es: 'JGB Fleet', en: 'JGB Fleet' } }
}

const CROWN_FLEETS_CONTAINER = {
  CXTC: { name: 'CXTC', description: { es: 'Crown Xpress Transport Container', en: 'Crown Xpress Transport Container' } }
}

// Standard container prefixes for CUSTOMER equipment
const CUSTOMER_CONTAINER_PREFIXES = {
  EMHU: { name: 'EMHU', description: { es: 'Emhu Container', en: 'Emhu Container' } },
  UMXU: { name: 'UMXU', description: { es: 'Umxu Container', en: 'Umxu Container' } },
  MEDU: { name: 'MEDU', description: { es: 'MSC Container', en: 'MSC Container' } },
  MSCU: { name: 'MSCU', description: { es: 'MSC Container', en: 'MSC Container' } },
  MAEU: { name: 'MAEU', description: { es: 'Maersk Container', en: 'Maersk Container' } },
  CMAU: { name: 'CMAU', description: { es: 'CMA CGM Container', en: 'CMA CGM Container' } },
  HLXU: { name: 'HLXU', description: { es: 'Hapag-Lloyd Container', en: 'Hapag-Lloyd Container' } },
  OOLU: { name: 'OOLU', description: { es: 'OOCL Container', en: 'OOCL Container' } },
  TCNU: { name: 'TCNU', description: { es: 'Triton Container', en: 'Triton Container' } },
  TRLU: { name: 'TRLU', description: { es: 'Triton Container', en: 'Triton Container' } }
}

export default function UnitInfoEnhanced({ onContainerChange, onSealChange, onLockChange, onInspectionTypeChange, onFlowComplete }) {
  const { t, language } = useLanguage()
  const { unitInfo, updateUnitInfo } = useInspection()
  const { user } = useAuth()
  // Sync local state with context - use context value as source of truth
  const [inspectionType, setInspectionType] = useState(unitInfo?.inspectionType || null)
  const [trailerType, setTrailerType] = useState(unitInfo?.trailerType || null)
  const [trailerSize, setTrailerSize] = useState(unitInfo?.trailerSize || null)
  const [equipmentOwner, setEquipmentOwner] = useState(unitInfo?.equipmentOwner || null)
  const [crownFleet, setCrownFleet] = useState(unitInfo?.crownFleet || null)
  const [customerPrefix, setCustomerPrefix] = useState(unitInfo?.customerPrefix || null)
  const [hasContainer, setHasContainer] = useState(false)
  const [hasSeal, setHasSeal] = useState(false)
  const [hasLock, setHasLock] = useState(false)
  // Flow control states - track if container/box number, seal/lock, and tractor number have been entered
  const [containerNumberEntered, setContainerNumberEntered] = useState(!!unitInfo?.trailerNumber)
  const [sealLockEntered, setSealLockEntered] = useState(false)
  const [tractorNumberEntered, setTractorNumberEntered] = useState(!!unitInfo?.tractorNumber)
  // Keypad states
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [keypadField, setKeypadField] = useState(null) // 'trailerNumber', 'chassisNumber', 'sealNumber', 'lockNumber'
  const [keypadTitle, setKeypadTitle] = useState('')
  const [searchMode, setSearchMode] = useState('number') // 'number', 'name', 'list', 'manual'
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [operatorName, setOperatorName] = useState('')
  const [operatorSearching, setOperatorSearching] = useState(false)
  const [operatorFound, setOperatorFound] = useState(null)
  const [operatorError, setOperatorError] = useState(null)
  const [operatorsList, setOperatorsList] = useState([])
  const [operatorsLoading, setOperatorsLoading] = useState(false)
  const [nameSearchResults, setNameSearchResults] = useState([])
  const [showNameResults, setShowNameResults] = useState(false)
  const [manualOperatorName, setManualOperatorName] = useState('')

  // Sync local inspectionType with context when context changes
  useEffect(() => {
    setInspectionType(unitInfo?.inspectionType || null)
    setTrailerType(unitInfo?.trailerType || null)
    setTrailerSize(unitInfo?.trailerSize || null)
    setEquipmentOwner(unitInfo?.equipmentOwner || null)
    setCrownFleet(unitInfo?.crownFleet || null)
    setCustomerPrefix(unitInfo?.customerPrefix || null)
  }, [unitInfo?.inspectionType, unitInfo?.trailerType, unitInfo?.trailerSize, unitInfo?.equipmentOwner, unitInfo?.crownFleet, unitInfo?.customerPrefix])

  // Handle inspection type selection
  const handleInspectionTypeChange = (type) => {
    setInspectionType(type)
    updateUnitInfo('inspectionType', type)
    
    // Reset trailer type, size, equipment owner, fleet and customer prefix when changing inspection type
    setTrailerType(null)
    setTrailerSize(null)
    setEquipmentOwner(null)
    setCrownFleet(null)
    setCustomerPrefix(null)
    updateUnitInfo('trailerType', null)
    updateUnitInfo('trailerSize', null)
    updateUnitInfo('equipmentOwner', null)
    updateUnitInfo('crownFleet', null)
    updateUnitInfo('customerPrefix', null)
    
    const typeConfig = INSPECTION_TYPES[type]
    
    // Reset fields based on type
    if (type === 'BOBTAIL') {
      // Bobtail: No trailer, no container, no seal, no lock - skip trailer selection
      setHasContainer(false)
      setHasSeal(false)
      setHasLock(false)
      updateUnitInfo('containerNumber', '')
      updateUnitInfo('sealNumber', '')
      updateUnitInfo('lockNumber', '')
      updateUnitInfo('trailerType', 'BOBTAIL')
      updateUnitInfo('trailerSize', 'N/A')
      setTrailerType('BOBTAIL')
      setTrailerSize('N/A')
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

  // Handle trailer type selection
  const handleTrailerTypeChange = (type) => {
    setTrailerType(type)
    setTrailerSize(null) // Reset size when changing type
    updateUnitInfo('trailerType', type)
    updateUnitInfo('trailerSize', null)
  }

  // Handle trailer size selection
  const handleTrailerSizeChange = (size) => {
    setTrailerSize(size)
    updateUnitInfo('trailerSize', size)
  }

  // Handle equipment owner selection
  const handleEquipmentOwnerChange = (owner) => {
    setEquipmentOwner(owner)
    updateUnitInfo('equipmentOwner', owner)
    // Reset crown fleet and customer prefix when changing owner
    setCrownFleet(null)
    setCustomerPrefix(null)
    updateUnitInfo('crownFleet', null)
    updateUnitInfo('customerPrefix', null)
  }

  // Handle crown fleet selection
  const handleCrownFleetChange = (fleet) => {
    setCrownFleet(fleet)
    updateUnitInfo('crownFleet', fleet)
  }

  // Handle customer prefix selection
  const handleCustomerPrefixChange = (prefix) => {
    setCustomerPrefix(prefix)
    updateUnitInfo('customerPrefix', prefix)
  }

  // Open keypad for a specific field
  const openKeypad = (field, title, currentValue = '') => {
    setKeypadField(field)
    setKeypadTitle(title)
    setKeypadOpen(true)
  }

  // Handle keypad confirmation
  const handleKeypadConfirm = (value) => {
    if (keypadField) {
      update(keypadField, value)
    }
    setKeypadOpen(false)
    setKeypadField(null)
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
    // Set today's date in YYYY-MM-DD format using Tijuana timezone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' })
    updateUnitInfo('inspectionDate', today)
    // Guard name is auto-assigned from logged in user
    updateUnitInfo('guardName', user?.full_name || '')
    updateUnitInfo('location', user?.location_id ? YARDS.find(y => y.id === user.location_id)?.name || '' : '')
  }, [user, updateUnitInfo])

  // Load all operators when list mode is selected
  useEffect(() => {
    if (searchMode === 'list' && operatorsList.length === 0) {
      loadOperatorsList()
    }
  }, [searchMode])

  // Notify parent when flow is complete (all steps done)
  useEffect(() => {
    // FLATBED doesn't require seal/lock
    const sealLockRequired = inspectionType === 'LOADED' && trailerType !== 'FLATBED'
    const isFlowComplete = (inspectionType === 'BOBTAIL') || 
      (containerNumberEntered && 
       (inspectionType === 'EMPTY' || sealLockEntered || !sealLockRequired) && 
       tractorNumberEntered)
    
    if (onFlowComplete) {
      onFlowComplete(isFlowComplete)
    }
  }, [inspectionType, trailerType, containerNumberEntered, sealLockEntered, tractorNumberEntered, onFlowComplete])

  const loadOperatorsList = async () => {
    setOperatorsLoading(true)
    try {
      const result = await listOperators()
      if (result.success && result.operators) {
        setOperatorsList(result.operators)
      }
    } catch (err) {
      console.error('Failed to load operators:', err)
    } finally {
      setOperatorsLoading(false)
    }
  }

  // Search operator by employee number
  const handleSearchOperator = async () => {
    if (!employeeNumber || employeeNumber.length < 3) {
      setOperatorError(language === 'es' ? 'Ingrese número de empleado' : 'Enter employee number')
      return
    }
    
    setOperatorSearching(true)
    setOperatorError(null)
    setOperatorFound(null)
    
    try {
      const result = await searchOperator(employeeNumber)
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

  // Search operators by name
  const handleSearchByName = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setNameSearchResults([])
      setShowNameResults(false)
      return
    }

    try {
      const result = await searchOperatorsByName(searchText)
      if (result.success && result.operators) {
        setNameSearchResults(result.operators)
        setShowNameResults(true)
      }
    } catch (err) {
      console.error('Search by name error:', err)
      setNameSearchResults([])
    }
  }

  // Select operator from list
  const handleSelectOperator = (operator) => {
    setOperatorFound(operator)
    updateUnitInfo('driverName', operator.fullName)
    updateUnitInfo('employeeNumber', operator.employeeNumber)
    setShowNameResults(false)
    setOperatorError(null)
  }

  // Handle manual entry
  const handleManualEntry = () => {
    if (manualOperatorName.trim()) {
      updateUnitInfo('driverName', manualOperatorName.toUpperCase())
      updateUnitInfo('employeeNumber', 'MANUAL')
      setOperatorFound({ fullName: manualOperatorName.toUpperCase(), employeeNumber: 'MANUAL' })
      setOperatorError(null)
    }
  }

  // Reset search when changing modes
  const handleModeChange = (mode) => {
    setSearchMode(mode)
    setOperatorFound(null)
    setOperatorError(null)
    setEmployeeNumber('')
    setOperatorName('')
    setManualOperatorName('')
    setShowNameResults(false)
    setNameSearchResults([])
    updateUnitInfo('driverName', '')
    updateUnitInfo('employeeNumber', '')
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

  // If LOADED or EMPTY selected but no trailer type, show trailer type selector
  if ((inspectionType === 'LOADED' || inspectionType === 'EMPTY') && !trailerType) {
    return (
      <section className="card animate-slide-up">
        <div className="card-header flex items-center gap-3">
          <Truck className="w-5 h-5 text-crown-gold" />
          <h2 className="font-bold tracking-wide uppercase text-sm">
            {language === 'es' ? 'TIPO DE REMOLQUE' : 'TRAILER TYPE'}
          </h2>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
            inspectionType === 'LOADED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {INSPECTION_TYPES[inspectionType]?.[language] || inspectionType}
          </span>
          <button
            type="button"
            onClick={() => {
              setInspectionType(null)
              updateUnitInfo('inspectionType', null)
            }}
            className="text-xs text-white/80 hover:text-white underline"
          >
            {language === 'es' ? 'CAMBIAR' : 'CHANGE'}
          </button>
        </div>
        <div className="card-body">
          <p className="text-sm text-slate-600 mb-4">
            {language === 'es' 
              ? 'Seleccione el tipo de remolque:' 
              : 'Select the trailer type:'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* BOX / CAJA */}
            <button
              type="button"
              onClick={() => handleTrailerTypeChange('BOX')}
              className="p-6 border-2 border-slate-200 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-3 group"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Box className="w-8 h-8 text-purple-600" />
              </div>
              <span className="font-bold text-lg text-slate-800">
                {language === 'es' ? 'CAJA' : 'BOX'}
              </span>
              <span className="text-xs text-slate-500 text-center">
                {language === 'es' ? 'Caja seca estándar' : 'Standard dry box'}
              </span>
            </button>

            {/* CONTAINER / CONTENEDOR */}
            <button
              type="button"
              onClick={() => handleTrailerTypeChange('CONTAINER')}
              className="p-6 border-2 border-slate-200 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-3 group"
            >
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                <Package className="w-8 h-8 text-cyan-600" />
              </div>
              <span className="font-bold text-lg text-slate-800">
                {language === 'es' ? 'CONTENEDOR' : 'CONTAINER'}
              </span>
              <span className="text-xs text-slate-500 text-center">
                {language === 'es' ? 'Contenedor intermodal' : 'Intermodal container'}
              </span>
            </button>

            {/* FLATBED / PLATAFORMA */}
            <button
              type="button"
              onClick={() => handleTrailerTypeChange('FLATBED')}
              className="p-6 border-2 border-slate-200 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-3 group"
            >
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Truck className="w-8 h-8 text-orange-600" />
              </div>
              <span className="font-bold text-lg text-slate-800">
                {language === 'es' ? 'PLATAFORMA' : 'FLATBED'}
              </span>
              <span className="text-xs text-slate-500 text-center">
                {language === 'es' ? 'Plataforma abierta' : 'Open flatbed'}
              </span>
            </button>

            {/* OTHER / OTROS */}
            <button
              type="button"
              onClick={() => handleTrailerTypeChange('OTHER')}
              className="p-6 border-2 border-slate-200 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-3 group"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <PackageX className="w-8 h-8 text-slate-600" />
              </div>
              <span className="font-bold text-lg text-slate-800">
                {language === 'es' ? 'OTROS' : 'OTHER'}
              </span>
              <span className="text-xs text-slate-500 text-center">
                {language === 'es' ? 'Otro tipo de equipo' : 'Other equipment type'}
              </span>
            </button>
          </div>
        </div>
      </section>
    )
  }

  // If trailer type selected but no size, show size selector
  if ((inspectionType === 'LOADED' || inspectionType === 'EMPTY') && trailerType && !trailerSize) {
    const typeConfig = TRAILER_TYPES[trailerType]
    const availableSizes = typeConfig?.sizes || ['53', '40', '20']
    
    return (
      <section className="card animate-slide-up">
        <div className="card-header flex items-center gap-3">
          <Truck className="w-5 h-5 text-crown-gold" />
          <h2 className="font-bold tracking-wide uppercase text-sm">
            {language === 'es' ? 'MEDIDA DEL REMOLQUE' : 'TRAILER SIZE'}
          </h2>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
            inspectionType === 'LOADED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {INSPECTION_TYPES[inspectionType]?.[language]} · {typeConfig?.[language] || trailerType}
          </span>
          <button
            type="button"
            onClick={() => {
              setTrailerType(null)
              updateUnitInfo('trailerType', null)
            }}
            className="text-xs text-white/80 hover:text-white underline"
          >
            {language === 'es' ? 'CAMBIAR' : 'CHANGE'}
          </button>
        </div>
        <div className="card-body">
          <p className="text-sm text-slate-600 mb-4">
            {language === 'es' 
              ? 'Seleccione la medida del remolque:' 
              : 'Select the trailer size:'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {availableSizes.map(size => (
              <button
                key={size}
                type="button"
                onClick={() => handleTrailerSizeChange(size)}
                className="p-6 border-2 border-slate-200 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-2 group"
              >
                <span className="font-bold text-3xl text-slate-800 group-hover:text-crown-gold transition-colors">
                  {size}'
                </span>
                <span className="text-xs text-slate-500">
                  {language === 'es' ? 'PIES' : 'FEET'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // If trailer size selected but no equipment owner, show owner selector
  if ((inspectionType === 'LOADED' || inspectionType === 'EMPTY') && trailerType && trailerSize && !equipmentOwner) {
    const typeConfig = TRAILER_TYPES[trailerType]
    
    return (
      <section className="card animate-slide-up">
        <div className="card-header flex items-center gap-3">
          <Truck className="w-5 h-5 text-crown-gold" />
          <h2 className="font-bold tracking-wide uppercase text-sm">
            {language === 'es' ? 'PROPIETARIO DEL EQUIPO' : 'EQUIPMENT OWNER'}
          </h2>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
            inspectionType === 'LOADED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {INSPECTION_TYPES[inspectionType]?.[language]} · {typeConfig?.[language] || trailerType} {trailerSize}'
          </span>
          <button
            type="button"
            onClick={() => {
              setTrailerSize(null)
              updateUnitInfo('trailerSize', null)
            }}
            className="text-xs text-white/80 hover:text-white underline"
          >
            {language === 'es' ? 'CAMBIAR' : 'CHANGE'}
          </button>
        </div>
        <div className="card-body">
          <p className="text-sm text-slate-600 mb-4">
            {language === 'es' 
              ? '¿El equipo es de Crown o de un cliente?' 
              : 'Is the equipment owned by Crown or a customer?'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CROWN */}
            <button
              type="button"
              onClick={() => handleEquipmentOwnerChange('CROWN')}
              className="p-6 border-2 border-slate-200 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-3 group"
            >
              <div className="w-16 h-16 bg-crown-gold/20 rounded-full flex items-center justify-center group-hover:bg-crown-gold/30 transition-colors">
                <Truck className="w-8 h-8 text-crown-gold" />
              </div>
              <span className="font-bold text-lg text-slate-800">
                {language === 'es' ? 'CROWN' : 'CROWN'}
              </span>
              <span className="text-xs text-slate-500 text-center">
                {language === 'es' ? 'Equipo propiedad de Crown Xpress' : 'Crown Xpress owned equipment'}
              </span>
            </button>

            {/* CUSTOMER / CLIENTE */}
            <button
              type="button"
              onClick={() => handleEquipmentOwnerChange('CUSTOMER')}
              className="p-6 border-2 border-slate-200 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-3 group"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <User className="w-8 h-8 text-slate-600" />
              </div>
              <span className="font-bold text-lg text-slate-800">
                {language === 'es' ? 'CLIENTE' : 'CUSTOMER'}
              </span>
              <span className="text-xs text-slate-500 text-center">
                {language === 'es' ? 'Equipo propiedad del cliente' : 'Customer owned equipment'}
              </span>
            </button>
          </div>
        </div>
      </section>
    )
  }

  // If CROWN selected but no fleet, show fleet selector
  if ((inspectionType === 'LOADED' || inspectionType === 'EMPTY') && trailerType && trailerSize && equipmentOwner === 'CROWN' && !crownFleet) {
    const typeConfig = TRAILER_TYPES[trailerType]
    
    return (
      <section className="card animate-slide-up">
        <div className="card-header flex items-center gap-3">
          <Truck className="w-5 h-5 text-crown-gold" />
          <h2 className="font-bold tracking-wide uppercase text-sm">
            {language === 'es' ? 'FLOTA CROWN' : 'CROWN FLEET'}
          </h2>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
            inspectionType === 'LOADED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {INSPECTION_TYPES[inspectionType]?.[language]} · {typeConfig?.[language] || trailerType} {trailerSize}' · CROWN
          </span>
          <button
            type="button"
            onClick={() => {
              setEquipmentOwner(null)
              updateUnitInfo('equipmentOwner', null)
            }}
            className="text-xs text-white/80 hover:text-white underline"
          >
            {language === 'es' ? 'CAMBIAR' : 'CHANGE'}
          </button>
        </div>
        <div className="card-body">
          <p className="text-sm text-slate-600 mb-4">
            {language === 'es' 
              ? 'Seleccione la flota de Crown:' 
              : 'Select the Crown fleet:'}
          </p>
          {/* Different fleets based on trailer type */}
          {trailerType === 'CONTAINER' ? (
            // CONTAINER fleets: CXTC + OTRO
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(CROWN_FLEETS_CONTAINER).map(([key, fleet]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCrownFleetChange(key)}
                  className="p-6 border-2 border-slate-200 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-2 group"
                >
                  <span className="font-bold text-2xl text-slate-800 group-hover:text-crown-gold transition-colors">
                    {fleet.name}
                  </span>
                  <span className="text-xs text-slate-500 text-center">
                    {fleet.description[language]}
                  </span>
                </button>
              ))}
              {/* OTRO - Custom prefix */}
              <button
                type="button"
                onClick={() => {
                  const customFleet = prompt(language === 'es' ? 'Ingrese el prefijo de la flota:' : 'Enter fleet prefix:')
                  if (customFleet && customFleet.trim()) {
                    handleCrownFleetChange(customFleet.trim().toUpperCase())
                  }
                }}
                className="p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-2 group"
              >
                <span className="font-bold text-2xl text-slate-500 group-hover:text-crown-gold transition-colors">
                  +
                </span>
                <span className="text-xs text-slate-500 text-center">
                  {language === 'es' ? 'OTRO' : 'OTHER'}
                </span>
              </button>
            </div>
          ) : (
            // BOX fleets: CXT, RBX, ABBA, JGB + OTRO
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(CROWN_FLEETS_BOX).map(([key, fleet]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCrownFleetChange(key)}
                  className="p-6 border-2 border-slate-200 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-2 group"
                >
                  <span className="font-bold text-2xl text-slate-800 group-hover:text-crown-gold transition-colors">
                    {fleet.name}
                  </span>
                  <span className="text-xs text-slate-500 text-center">
                    {fleet.description[language]}
                  </span>
                </button>
              ))}
              {/* OTRO - Custom prefix */}
              <button
                type="button"
                onClick={() => {
                  const customFleet = prompt(language === 'es' ? 'Ingrese el prefijo de la flota:' : 'Enter fleet prefix:')
                  if (customFleet && customFleet.trim()) {
                    handleCrownFleetChange(customFleet.trim().toUpperCase())
                  }
                }}
                className="p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-2 group"
              >
                <span className="font-bold text-2xl text-slate-500 group-hover:text-crown-gold transition-colors">
                  +
                </span>
                <span className="text-xs text-slate-500 text-center">
                  {language === 'es' ? 'OTRO' : 'OTHER'}
                </span>
              </button>
            </div>
          )}
        </div>
      </section>
    )
  }

  // If CUSTOMER selected with CONTAINER but no prefix, show prefix selector
  if ((inspectionType === 'LOADED' || inspectionType === 'EMPTY') && trailerType === 'CONTAINER' && trailerSize && equipmentOwner === 'CUSTOMER' && !customerPrefix) {
    const typeConfig = TRAILER_TYPES[trailerType]
    
    return (
      <section className="card animate-slide-up">
        <div className="card-header flex items-center gap-3">
          <Package className="w-5 h-5 text-crown-gold" />
          <h2 className="font-bold tracking-wide uppercase text-sm">
            {language === 'es' ? 'PREFIJO DEL CONTENEDOR' : 'CONTAINER PREFIX'}
          </h2>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
            inspectionType === 'LOADED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {INSPECTION_TYPES[inspectionType]?.[language]} · {typeConfig?.[language] || trailerType} {trailerSize}' · CLIENTE
          </span>
          <button
            type="button"
            onClick={() => {
              setEquipmentOwner(null)
              updateUnitInfo('equipmentOwner', null)
            }}
            className="text-xs text-white/80 hover:text-white underline"
          >
            {language === 'es' ? 'CAMBIAR' : 'CHANGE'}
          </button>
        </div>
        <div className="card-body">
          <p className="text-sm text-slate-600 mb-4">
            {language === 'es' 
              ? 'Seleccione el prefijo del contenedor:' 
              : 'Select the container prefix:'}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {Object.entries(CUSTOMER_CONTAINER_PREFIXES).map(([key, prefix]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleCustomerPrefixChange(key)}
                className="p-4 border-2 border-slate-200 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-1 group"
              >
                <span className="font-bold text-xl text-slate-800 group-hover:text-crown-gold transition-colors">
                  {prefix.name}
                </span>
                <span className="text-xs text-slate-500 text-center">
                  {prefix.description[language]}
                </span>
              </button>
            ))}
            {/* OTRO - Custom prefix */}
            <button
              type="button"
              onClick={() => {
                const customPrefix = prompt(language === 'es' ? 'Ingrese el prefijo del contenedor (4 letras):' : 'Enter container prefix (4 letters):')
                if (customPrefix && customPrefix.trim()) {
                  handleCustomerPrefixChange(customPrefix.trim().toUpperCase())
                }
              }}
              className="p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition-all flex flex-col items-center gap-1 group"
            >
              <span className="font-bold text-xl text-slate-500 group-hover:text-crown-gold transition-colors">
                +
              </span>
              <span className="text-xs text-slate-500 text-center">
                {language === 'es' ? 'OTRO' : 'OTHER'}
              </span>
            </button>
          </div>
        </div>
      </section>
    )
  }

  // Build badge text with trailer info
  const getBadgeText = () => {
    const typeLabel = INSPECTION_TYPES[inspectionType]?.[language] || inspectionType
    if (inspectionType === 'BOBTAIL') return typeLabel
    const trailerLabel = TRAILER_TYPES[trailerType]?.[language] || trailerType
    let ownerLabel = ''
    if (equipmentOwner === 'CROWN' && crownFleet) {
      ownerLabel = crownFleet
    } else if (equipmentOwner === 'CUSTOMER' && trailerType === 'CONTAINER' && customerPrefix) {
      ownerLabel = customerPrefix
    } else {
      ownerLabel = EQUIPMENT_OWNERS[equipmentOwner]?.[language] || equipmentOwner
    }
    return `${typeLabel} · ${trailerLabel} ${trailerSize}' · ${ownerLabel}`
  }

  // Get trailer number label based on type
  const getTrailerNumberLabel = () => {
    if (trailerType === 'CONTAINER') return language === 'es' ? 'NÚMERO DE CONTENEDOR' : 'CONTAINER NUMBER'
    if (trailerType === 'BOX') return language === 'es' ? 'NÚMERO DE CAJA' : 'BOX NUMBER'
    if (trailerType === 'FLATBED') return language === 'es' ? 'NÚMERO DE PLATAFORMA' : 'FLATBED NUMBER'
    return language === 'es' ? 'NÚMERO DE REMOLQUE' : 'TRAILER NUMBER'
  }

  // Check if prefix/fleet is selected (for flow control)
  const isPrefixSelected = () => {
    if (inspectionType === 'BOBTAIL') return true
    if (equipmentOwner === 'CROWN' && crownFleet) return true
    if (equipmentOwner === 'CUSTOMER') {
      if (trailerType === 'CONTAINER' && customerPrefix) return true
      if (trailerType !== 'CONTAINER') return true // BOX/FLATBED don't need prefix
    }
    return false
  }

  // Step: Enter container/box/flatbed number after prefix selection
  if ((inspectionType === 'LOADED' || inspectionType === 'EMPTY') && isPrefixSelected() && !containerNumberEntered) {
    const typeConfig = TRAILER_TYPES[trailerType]
    
    return (
      <section className="card animate-slide-up">
        <div className="card-header flex items-center gap-3">
          <Package className="w-5 h-5 text-crown-gold" />
          <h2 className="font-bold tracking-wide uppercase text-sm">
            {getTrailerNumberLabel()}
          </h2>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
            inspectionType === 'LOADED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {getBadgeText()}
          </span>
        </div>
        <div className="card-body">
          <p className="text-sm text-slate-600 mb-4">
            {language === 'es' 
              ? `Ingrese el número de ${trailerType === 'CONTAINER' ? 'contenedor' : trailerType === 'BOX' ? 'caja' : trailerType === 'FLATBED' ? 'plataforma' : 'remolque'}:` 
              : `Enter the ${trailerType === 'CONTAINER' ? 'container' : trailerType === 'BOX' ? 'box' : trailerType === 'FLATBED' ? 'flatbed' : 'trailer'} number:`}
          </p>
          
          {/* Show prefix if applicable */}
          {(equipmentOwner === 'CROWN' && crownFleet) || (equipmentOwner === 'CUSTOMER' && trailerType === 'CONTAINER' && customerPrefix) ? (
            <div className="mb-4 p-3 bg-slate-100 rounded-lg">
              <span className="text-sm text-slate-600">{language === 'es' ? 'Prefijo:' : 'Prefix:'}</span>
              <span className="ml-2 font-bold text-lg text-crown-navy">
                {equipmentOwner === 'CROWN' ? crownFleet : customerPrefix}
              </span>
            </div>
          ) : null}

          <div className="flex gap-3">
            <input
              type="text"
              value={unitInfo.trailerNumber || ''}
              readOnly
              onClick={() => openKeypad('trailerNumber', getTrailerNumberLabel())}
              className="flex-1 px-4 py-4 border-2 border-slate-300 rounded-xl text-2xl font-bold text-center uppercase cursor-pointer hover:border-crown-gold transition-colors"
              placeholder={language === 'es' ? 'TOCA PARA INGRESAR' : 'TAP TO ENTER'}
            />
            <button
              type="button"
              onClick={() => openKeypad('trailerNumber', getTrailerNumberLabel())}
              className="px-6 py-4 bg-crown-navy text-white rounded-xl hover:bg-crown-navy/90 transition-colors"
            >
              <Keyboard className="w-8 h-8" />
            </button>
          </div>

          {/* Chassis number for CONTAINER */}
          {trailerType === 'CONTAINER' && (
            <div className="mt-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {language === 'es' ? 'NÚMERO DE CHASIS' : 'CHASSIS NUMBER'} <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={unitInfo.chassisNumber || ''}
                  readOnly
                  onClick={() => openKeypad('chassisNumber', language === 'es' ? 'NÚMERO DE CHASIS' : 'CHASSIS NUMBER')}
                  className="flex-1 px-4 py-4 border-2 border-slate-300 rounded-xl text-2xl font-bold text-center uppercase cursor-pointer hover:border-crown-gold transition-colors"
                  placeholder={language === 'es' ? 'TOCA PARA INGRESAR' : 'TAP TO ENTER'}
                />
                <button
                  type="button"
                  onClick={() => openKeypad('chassisNumber', language === 'es' ? 'NÚMERO DE CHASIS' : 'CHASSIS NUMBER')}
                  className="px-6 py-4 bg-crown-navy text-white rounded-xl hover:bg-crown-navy/90 transition-colors"
                >
                  <Keyboard className="w-8 h-8" />
                </button>
              </div>
            </div>
          )}

          {/* Continue button */}
          <button
            type="button"
            onClick={() => {
              if (unitInfo.trailerNumber && unitInfo.trailerNumber.trim()) {
                if (trailerType === 'CONTAINER' && (!unitInfo.chassisNumber || !unitInfo.chassisNumber.trim())) {
                  alert(language === 'es' ? 'Ingrese el número de chasis' : 'Enter the chassis number')
                  return
                }
                setContainerNumberEntered(true)
              } else {
                alert(language === 'es' ? 'Ingrese el número' : 'Enter the number')
              }
            }}
            disabled={!unitInfo.trailerNumber || !unitInfo.trailerNumber.trim()}
            className="mt-6 w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-lg"
          >
            {language === 'es' ? 'CONTINUAR' : 'CONTINUE'}
          </button>
        </div>

        {/* Keypad */}
        <NumericKeypad
          isOpen={keypadOpen}
          onClose={() => setKeypadOpen(false)}
          onConfirm={handleKeypadConfirm}
          title={keypadTitle}
          initialValue=""
        />
      </section>
    )
  }

  // Step: Enter seal/lock for LOADED inspections (after container number) - NOT for FLATBED
  // FLATBED (plataforma) does not require seal or lock
  if (inspectionType === 'LOADED' && containerNumberEntered && !sealLockEntered && trailerType !== 'FLATBED') {
    return (
      <section className="card animate-slide-up">
        <div className="card-header flex items-center gap-3">
          <Lock className="w-5 h-5 text-crown-gold" />
          <h2 className="font-bold tracking-wide uppercase text-sm">
            {language === 'es' ? 'SELLO O CANDADO' : 'SEAL OR LOCK'}
          </h2>
          <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            {getBadgeText()}
          </span>
        </div>
        <div className="card-body">
          <p className="text-sm text-slate-600 mb-4">
            {language === 'es' 
              ? 'Para inspección CARGADO, ingrese el número de sello O candado:' 
              : 'For LOADED inspection, enter the seal OR lock number:'}
          </p>

          {/* Toggle between Seal and Lock */}
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                setHasSeal(true)
                setHasLock(false)
                updateUnitInfo('lockNumber', '')
              }}
              className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                hasSeal ? 'bg-crown-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {language === 'es' ? '🔒 SELLO' : '🔒 SEAL'}
            </button>
            <button
              type="button"
              onClick={() => {
                setHasSeal(false)
                setHasLock(true)
                updateUnitInfo('sealNumber', '')
              }}
              className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                hasLock ? 'bg-crown-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {language === 'es' ? '🔐 CANDADO' : '🔐 LOCK'}
            </button>
          </div>

          {/* Seal input */}
          {hasSeal && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {language === 'es' ? 'NÚMERO DE SELLO' : 'SEAL NUMBER'} <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={unitInfo.sealNumber || ''}
                  readOnly
                  onClick={() => openKeypad('sealNumber', language === 'es' ? 'NÚMERO DE SELLO' : 'SEAL NUMBER')}
                  className="flex-1 px-4 py-4 border-2 border-slate-300 rounded-xl text-2xl font-bold text-center uppercase cursor-pointer hover:border-crown-gold transition-colors"
                  placeholder={language === 'es' ? 'TOCA PARA INGRESAR' : 'TAP TO ENTER'}
                />
                <button
                  type="button"
                  onClick={() => openKeypad('sealNumber', language === 'es' ? 'NÚMERO DE SELLO' : 'SEAL NUMBER')}
                  className="px-6 py-4 bg-crown-navy text-white rounded-xl hover:bg-crown-navy/90 transition-colors"
                >
                  <Keyboard className="w-8 h-8" />
                </button>
              </div>
            </div>
          )}

          {/* Lock input */}
          {hasLock && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {language === 'es' ? 'NÚMERO DE CANDADO' : 'LOCK NUMBER'} <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={unitInfo.lockNumber || ''}
                  readOnly
                  onClick={() => openKeypad('lockNumber', language === 'es' ? 'NÚMERO DE CANDADO' : 'LOCK NUMBER')}
                  className="flex-1 px-4 py-4 border-2 border-slate-300 rounded-xl text-2xl font-bold text-center uppercase cursor-pointer hover:border-crown-gold transition-colors"
                  placeholder={language === 'es' ? 'TOCA PARA INGRESAR' : 'TAP TO ENTER'}
                />
                <button
                  type="button"
                  onClick={() => openKeypad('lockNumber', language === 'es' ? 'NÚMERO DE CANDADO' : 'LOCK NUMBER')}
                  className="px-6 py-4 bg-crown-navy text-white rounded-xl hover:bg-crown-navy/90 transition-colors"
                >
                  <Keyboard className="w-8 h-8" />
                </button>
              </div>
            </div>
          )}

          {/* Continue button */}
          <button
            type="button"
            onClick={() => {
              const hasSealValue = hasSeal && unitInfo.sealNumber && unitInfo.sealNumber.trim()
              const hasLockValue = hasLock && unitInfo.lockNumber && unitInfo.lockNumber.trim()
              if (hasSealValue || hasLockValue) {
                setSealLockEntered(true)
                if (onSealChange) onSealChange(hasSeal)
                if (onLockChange) onLockChange(hasLock)
              } else {
                alert(language === 'es' ? 'Seleccione e ingrese sello o candado' : 'Select and enter seal or lock')
              }
            }}
            disabled={!(hasSeal || hasLock)}
            className="mt-4 w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-lg"
          >
            {language === 'es' ? 'CONTINUAR' : 'CONTINUE'}
          </button>
        </div>

        {/* Keypad */}
        <NumericKeypad
          isOpen={keypadOpen}
          onClose={() => setKeypadOpen(false)}
          onConfirm={handleKeypadConfirm}
          title={keypadTitle}
          initialValue=""
        />
      </section>
    )
  }

  // Step: Enter tractor number (after seal/lock for LOADED, after container for EMPTY)
  // For FLATBED: skip seal/lock step entirely
  const shouldShowTractorStep = (inspectionType === 'LOADED' || inspectionType === 'EMPTY') && 
    containerNumberEntered && 
    (inspectionType === 'EMPTY' || sealLockEntered || trailerType === 'FLATBED') && 
    !tractorNumberEntered

  if (shouldShowTractorStep) {
    return (
      <section className="card animate-slide-up">
        <div className="card-header flex items-center gap-3">
          <Truck className="w-5 h-5 text-crown-gold" />
          <h2 className="font-bold tracking-wide uppercase text-sm">
            {language === 'es' ? 'NÚMERO DE TRACTOR' : 'TRACTOR NUMBER'}
          </h2>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
            inspectionType === 'LOADED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {getBadgeText()}
          </span>
        </div>
        <div className="card-body">
          <p className="text-sm text-slate-600 mb-4">
            {language === 'es' 
              ? 'Ingrese el número de tractor:' 
              : 'Enter the tractor number:'}
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              value={unitInfo.tractorNumber || ''}
              readOnly
              onClick={() => openKeypad('tractorNumber', language === 'es' ? 'NÚMERO DE TRACTOR' : 'TRACTOR NUMBER')}
              className="flex-1 px-4 py-4 border-2 border-slate-300 rounded-xl text-2xl font-bold text-center uppercase cursor-pointer hover:border-crown-gold transition-colors"
              placeholder={language === 'es' ? 'TOCA PARA INGRESAR' : 'TAP TO ENTER'}
            />
            <button
              type="button"
              onClick={() => openKeypad('tractorNumber', language === 'es' ? 'NÚMERO DE TRACTOR' : 'TRACTOR NUMBER')}
              className="px-6 py-4 bg-crown-navy text-white rounded-xl hover:bg-crown-navy/90 transition-colors"
            >
              <Keyboard className="w-8 h-8" />
            </button>
          </div>

          {/* Continue button */}
          <button
            type="button"
            onClick={() => {
              if (unitInfo.tractorNumber && unitInfo.tractorNumber.trim()) {
                setTractorNumberEntered(true)
              } else {
                alert(language === 'es' ? 'Ingrese el número de tractor' : 'Enter the tractor number')
              }
            }}
            disabled={!unitInfo.tractorNumber || !unitInfo.tractorNumber.trim()}
            className="mt-6 w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-lg"
          >
            {language === 'es' ? 'CONTINUAR A INSPECCIÓN' : 'CONTINUE TO INSPECTION'}
          </button>
        </div>

        {/* Keypad */}
        <NumericKeypad
          isOpen={keypadOpen}
          onClose={() => setKeypadOpen(false)}
          onConfirm={handleKeypadConfirm}
          title={keypadTitle}
          initialValue=""
        />
      </section>
    )
  }

  // If all steps completed, show minimal info card (inspection points will be shown by parent)
  // For BOBTAIL: skip container/seal/tractor checks - go directly to operator search
  const isBobtailReady = inspectionType === 'BOBTAIL'
  const isOtherReady = containerNumberEntered && (inspectionType !== 'LOADED' || sealLockEntered) && tractorNumberEntered
  
  if (!isBobtailReady && !isOtherReady) {
    // This shouldn't happen, but just in case
    return null
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
          {getBadgeText()}
        </span>
        <button
          type="button"
          onClick={() => {
            setInspectionType(null)
            setTrailerType(null)
            setTrailerSize(null)
            setEquipmentOwner(null)
            setCrownFleet(null)
            setCustomerPrefix(null)
            setContainerNumberEntered(false)
            setSealLockEntered(false)
            setTractorNumberEntered(false)
            updateUnitInfo('inspectionType', null)
            updateUnitInfo('trailerType', null)
            updateUnitInfo('trailerSize', null)
            updateUnitInfo('equipmentOwner', null)
            updateUnitInfo('crownFleet', null)
            updateUnitInfo('customerPrefix', null)
            updateUnitInfo('trailerNumber', '')
            updateUnitInfo('chassisNumber', '')
            updateUnitInfo('sealNumber', '')
            updateUnitInfo('lockNumber', '')
            updateUnitInfo('tractorNumber', '')
          }}
          className="text-xs text-white/80 hover:text-white underline"
        >
          {language === 'es' ? 'CAMBIAR' : 'CHANGE'}
        </button>
      </div>
      <div className="card-body">
        {/* Summary of entered info - hide for BOBTAIL since there's no trailer info */}
        {inspectionType !== 'BOBTAIL' && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-slate-500 text-xs">{getTrailerNumberLabel()}:</span>
                <div className="font-bold text-slate-800">{unitInfo.trailerNumber || '-'}</div>
              </div>
              {trailerType === 'CONTAINER' && (
                <div>
                  <span className="text-slate-500 text-xs">{language === 'es' ? 'CHASIS' : 'CHASSIS'}:</span>
                  <div className="font-bold text-slate-800">{unitInfo.chassisNumber || '-'}</div>
                </div>
              )}
              {inspectionType === 'LOADED' && hasSeal && (
                <div>
                  <span className="text-slate-500 text-xs">{language === 'es' ? 'SELLO' : 'SEAL'}:</span>
                  <div className="font-bold text-slate-800">{unitInfo.sealNumber || '-'}</div>
                </div>
              )}
              {inspectionType === 'LOADED' && hasLock && (
                <div>
                  <span className="text-slate-500 text-xs">{language === 'es' ? 'CANDADO' : 'LOCK'}:</span>
                  <div className="font-bold text-slate-800">{unitInfo.lockNumber || '-'}</div>
                </div>
              )}
              <div>
                <span className="text-slate-500 text-xs">{language === 'es' ? 'TRACTOR' : 'TRACTOR'}:</span>
                <div className="font-bold text-slate-800">{unitInfo.tractorNumber || '-'}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Operator Search Section - Enhanced with multiple options */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3">
            <div className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center justify-between uppercase">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {language === 'es' ? 'BÚSQUEDA DE OPERADOR' : 'OPERATOR SEARCH'} <span className="text-rose-500">*</span>
                </span>
                {operatorFound && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              </label>

              {/* Search Mode Tabs */}
              <div className="flex gap-2 mb-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleModeChange('number')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    searchMode === 'number' ? 'bg-crown-navy text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {language === 'es' ? 'Por Número' : 'By Number'}
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('name')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    searchMode === 'name' ? 'bg-crown-navy text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {language === 'es' ? 'Por Nombre' : 'By Name'}
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('list')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    searchMode === 'list' ? 'bg-crown-navy text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {language === 'es' ? 'Lista' : 'List'}
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('manual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    searchMode === 'manual' ? 'bg-crown-navy text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {language === 'es' ? 'Manual' : 'Manual'}
                </button>
              </div>

              {/* Search by Number */}
              {searchMode === 'number' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase">
                    {language === 'es' ? 'Número de Empleado' : 'Employee Number'}
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
                        'border-white focus:border-crown-navy'
                      }`}
                      placeholder={language === 'es' ? 'EJ: EMP001' : 'E.G.: EMP001'}
                    />
                    <button
                      type="button"
                      onClick={handleSearchOperator}
                      disabled={operatorSearching}
                      className="px-4 py-2 bg-crown-navy text-white rounded-lg hover:bg-crown-navy/90 disabled:opacity-50 flex items-center gap-2"
                    >
                      {operatorSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">{language === 'es' ? 'Buscar' : 'Search'}</span>
                    </button>
                  </div>
                  {operatorError && (
                    <p className="text-xs text-rose-600 mt-2">⚠️ {operatorError}</p>
                  )}
                </div>
              )}

              {/* Search by Name */}
              {searchMode === 'name' && (
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase">
                    {language === 'es' ? 'Nombre o Apellido' : 'First or Last Name'}
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={e => {
                      const val = e.target.value
                      setOperatorName(val)
                      handleSearchByName(val)
                    }}
                    className="w-full px-3 py-2 border-2 border-white rounded-lg focus:outline-none focus:ring-2 focus:border-crown-navy uppercase"
                    placeholder={language === 'es' ? 'EJ: JUAN, GARCIA, ETC.' : 'E.G.: JOHN, SMITH, ETC.'}
                  />
                  {showNameResults && nameSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {nameSearchResults.map(op => (
                        <button
                          key={op.id}
                          type="button"
                          onClick={() => {
                            handleSelectOperator(op)
                            setOperatorName('')
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-crown-gold/10 border-b border-slate-100 last:border-0 transition-colors"
                        >
                          <div className="font-semibold text-slate-800">{op.fullName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{op.employeeNumber}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showNameResults && nameSearchResults.length === 0 && operatorName.length >= 2 && (
                    <p className="text-xs text-slate-500 mt-2">
                      {language === 'es' ? 'No se encontraron resultados' : 'No results found'}
                    </p>
                  )}
                </div>
              )}

              {/* List All Operators */}
              {searchMode === 'list' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase">
                    {language === 'es' ? 'Seleccionar de la Lista' : 'Select from List'}
                  </label>
                  {operatorsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-crown-navy" />
                      <span className="ml-2 text-sm text-slate-600">
                        {language === 'es' ? 'Cargando...' : 'Loading...'}
                      </span>
                    </div>
                  ) : (
                    <select
                      value={operatorFound?.id || ''}
                      onChange={e => {
                        const selected = operatorsList.find(op => op.id === parseInt(e.target.value))
                        if (selected) handleSelectOperator(selected)
                      }}
                      className="w-full px-3 py-2 border-2 border-white rounded-lg focus:outline-none focus:ring-2 focus:border-crown-navy uppercase"
                    >
                      <option value="">
                        {language === 'es' ? 'SELECCIONE UN OPERADOR...' : 'SELECT AN OPERATOR...'}
                      </option>
                      {operatorsList.map(op => (
                        <option key={op.id} value={op.id}>
                          {op.fullName} ({op.employeeNumber})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Manual Entry */}
              {searchMode === 'manual' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase">
                    {language === 'es' ? 'Ingresar Manualmente' : 'Enter Manually'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualOperatorName}
                      onChange={e => setManualOperatorName(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleManualEntry()}
                      className="flex-1 px-3 py-2 border-2 border-white rounded-lg focus:outline-none focus:ring-2 focus:border-crown-navy uppercase"
                      placeholder={language === 'es' ? 'NOMBRE COMPLETO DEL OPERADOR' : 'FULL OPERATOR NAME'}
                    />
                    <button
                      type="button"
                      onClick={handleManualEntry}
                      className="px-4 py-2 bg-crown-navy text-white rounded-lg hover:bg-crown-navy/90 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">{language === 'es' ? 'Confirmar' : 'Confirm'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ {language === 'es' ? 'No se validará con la base de datos' : 'Will not be validated with database'}
                  </p>
                </div>
              )}

              {/* Selected Operator Display */}
              {operatorFound && (
                <div className="mt-4 p-3 bg-emerald-50 border-2 border-emerald-400 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-emerald-800 uppercase">
                        ✓ {operatorFound.fullName}
                      </div>
                      <div className="text-xs text-emerald-600 mt-0.5">
                        {language === 'es' ? 'No. Empleado:' : 'Employee #:'} {operatorFound.employeeNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleModeChange(searchMode)}
                      className="text-xs text-emerald-700 hover:text-emerald-900 underline"
                    >
                      {language === 'es' ? 'Cambiar' : 'Change'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
      </div>

      {/* Numeric Keypad Modal */}
      <NumericKeypad
        isOpen={keypadOpen}
        onClose={() => setKeypadOpen(false)}
        onConfirm={handleKeypadConfirm}
        title={keypadTitle}
        initialValue={keypadField ? (unitInfo[keypadField] || '') : ''}
        maxLength={20}
      />
    </section>
  )
}
