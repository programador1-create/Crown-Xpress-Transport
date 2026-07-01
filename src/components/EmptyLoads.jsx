import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Filter, Truck, Calendar, MapPin, Package, Clock, User, ArrowRight, X, Eye, FileText, ClipboardCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getTprMovements } from '../utils/api'

// Helper component for detail rows
function DetailRow({ label, value }) {
  const displayValue = value?.toString().trim() || '-'
  return (
    <div>
      <span className="text-xs text-slate-500 block">{label}</span>
      <span className="text-sm font-medium text-slate-800">{displayValue}</span>
    </div>
  )
}

export default function EmptyLoads({ onSelectMovement, onClose }) {
  const { t, language } = useLanguage()
  const { user, refreshUser } = useAuth()
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredMovements, setFilteredMovements] = useState([])
  const [selectedMovement, setSelectedMovement] = useState(null)
  const [hideInspected, setHideInspected] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [todayPendingCount, setTodayPendingCount] = useState(0)
  const [olderPendingCount, setOlderPendingCount] = useState(0)
  const [countdown, setCountdown] = useState(60)
  const pollingRef = useRef(null)
  const countdownRef = useRef(null)

  const loadMovements = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      let refreshedUser = user
      if (refreshUser) refreshedUser = await refreshUser() || user
      const yardCodes = refreshedUser?.yard_assignments?.map(ya => ya.yard_code).filter(Boolean) || []
      const yardCode = yardCodes.length > 0 ? yardCodes.join(',') : null
      const res = await getTprMovements({ type: 'all', yardCode })
      if (res.success) {
        const movementsData = res.data || []
        setMovements(movementsData)
        
        // Filter by last 2 days for pending count - separate today vs older
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        
        const todayPending = movementsData.filter(m => {
          if (!m.date) return false
          const movementDate = new Date(m.date).toISOString().split('T')[0]
          return movementDate === today && !m.already_inspected
        })
        
        const olderPending = movementsData.filter(m => {
          if (!m.date) return false
          const movementDate = new Date(m.date).toISOString().split('T')[0]
          return movementDate !== today && !m.already_inspected
        })
        
        setTodayPendingCount(todayPending.length)
        setOlderPendingCount(olderPending.length)
        setPendingCount(todayPending.length + olderPending.length)
        setLastUpdated(res.last_updated ? new Date(res.last_updated) : new Date())
        setError(null)
      } else {
        setError('Error al cargar salidas pendientes')
      }
    } catch (err) {
      const errorMsg = err.message || ''
      if (errorMsg.includes('SQL Server') || errorMsg.includes('credentials')) {
        setError('SQL Server no configurado. Configura SQLSERVER_HOST, SQLSERVER_USER y SQLSERVER_PASSWORD en Vercel.')
      } else {
        setError(err.message || 'Error de conexión')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user, refreshUser])

  // Initial load
  useEffect(() => { loadMovements() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Polling every 60 seconds — stable ref avoids re-creating interval on re-renders
  const loadMovementsRef = useRef(loadMovements)
  useEffect(() => { loadMovementsRef.current = loadMovements }, [loadMovements])

  useEffect(() => {
    setCountdown(60)
    pollingRef.current = setInterval(() => {
      loadMovementsRef.current(true)
      setCountdown(60)
    }, 60000)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 60 : prev - 1))
    }, 1000)
    return () => {
      clearInterval(pollingRef.current)
      clearInterval(countdownRef.current)
    }
  }, []) // run once on mount

  useEffect(() => {
    filterMovements()
  }, [movements, searchTerm, hideInspected])


  const filterMovements = () => {
    let filtered = [...movements]

    // Ocultar ya inspeccionadas: siempre para roles normales, o si el toggle está activo para admin/auditor
    const isAdminOrAuditor = user?.role === 'admin' || user?.role === 'auditor'
    if (!isAdminOrAuditor || hideInspected) {
      filtered = filtered.filter(m => !m.already_inspected)
    }

    // Filtrar por término de búsqueda (solo por unidad/equipo)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(m =>
        m.truck_id?.toLowerCase().includes(term) ||
        m.equipment_code?.toLowerCase().includes(term)
      )
    }

    // Filtrar por fecha de los últimos 2 días
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    filtered = filtered.filter(m => {
      if (!m.date) return false
      const movementDate = new Date(m.date).toISOString().split('T')[0]
      return movementDate === today || movementDate === yesterday
    })

    setFilteredMovements(filtered)
  }

  const handleSelectMovement = (movement) => {
    // Determinar tipo de equipo e inspección basado en campos TPR
    const el = movement.equipment_type?.trim() // 'L' = Loaded, 'E' = Empty
    const eqpcode = movement.equipment_code?.trim() || ''
    const isBotada = eqpcode.includes('Botada') || eqpcode.includes('BOTADA')
    
    let inspectionType = 'LOADED'
    let inspectionReason = ''
    
    if (isBotada) {
      inspectionType = 'BOBTAIL'
      inspectionReason = 'Botada - Solo tractor sin trailer'
    } else if (el === 'E') {
      inspectionType = 'EMPTY'
      inspectionReason = 'Vacío - Trailer sin carga'
    } else if (el === 'L') {
      inspectionType = 'LOADED'
      inspectionReason = 'Cargado - Trailer con carga'
    }

    // Preparar datos para la inspección
    const inspectionData = {
      workOrder: movement.work_order,
      truckNumber: movement.truck_id?.trim(),
      driverCode: movement.driver_code?.trim(),
      origin: {
        code: movement.from_code?.trim(),
        city: movement.from_city?.trim(),
        state: movement.from_state?.trim()
      },
      destination: {
        code: movement.to_code?.trim(),
        city: movement.to_city?.trim(),
        state: movement.to_state?.trim()
      },
      customer: movement.customer?.trim(),
      equipmentCode: eqpcode,
      equipmentType: el, // 'L' o 'E'
      seal: movement.seal?.trim(),
      instructions: [movement.instructions_1, movement.instructions_2].filter(Boolean).join(' | '),
      arrivalTime: movement.arrival_time,
      departureTime: movement.departure_time,
      operator: movement.operator?.trim(),
      inspectionType: inspectionType, // 'LOADED', 'EMPTY', o 'BOBTAIL'
      inspectionReason: inspectionReason,
      date: movement.date,
      tprData: movement // Guardar datos originales por si se necesitan
    }

    onSelectMovement(inspectionData)
    onClose()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    // Formato MM/DD/YYYY o DD/MM/YYYY
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      return `${parts[1]}/${parts[0]}/${parts[2]}`
    }
    return dateStr
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-crown-navy border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-crown-navy">
              {language === 'es' ? 'Cargando salidas pendientes...' : 'Loading pending outputs...'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-crown-navy">
              {language === 'es' ? 'Salidas Pendientes NBCW' : 'NBCW Pending Outputs'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-crown-navy' : 'text-slate-400'}`} />
                {language === 'es' ? `Actualiza en ${countdown}s` : `Refreshes in ${countdown}s`}
              </span>
              {lastUpdated && (
                <span className="text-xs text-slate-400">
                  {language === 'es' ? 'Última actualización:' : 'Last updated:'}{' '}
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {pendingCount} {language === 'es' ? 'pendientes' : 'pending'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { loadMovements(true); setCountdown(60) }}
              disabled={refreshing}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title={language === 'es' ? 'Actualizar ahora' : 'Refresh now'}
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Toggle hide inspected - solo admin/auditor */}
        {(user?.role === 'admin' || user?.role === 'auditor') && (
          <div className="flex items-center gap-3 mb-3 p-2 bg-slate-50 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideInspected}
                onChange={e => setHideInspected(e.target.checked)}
                className="w-4 h-4 rounded accent-crown-navy"
              />
              <span className="text-sm font-medium text-slate-700">
                {language === 'es' ? 'Ocultar ya inspeccionadas' : 'Hide already inspected'}
              </span>
            </label>
            <span className="ml-auto text-xs text-slate-500">
              {movements.filter(m => m.already_inspected).length}{' '}
              {language === 'es' ? 'ya inspeccionadas en últimos 30 días' : 'already inspected in last 30 days'}
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'es' ? 'Buscar por número de camión o equipo...' : 'Search by truck number or equipment...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-auto">
          {filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">
                {language === 'es' 
                  ? (searchTerm 
                      ? 'No se encontraron salidas pendientes con los filtros aplicados' 
                      : 'No hay salidas pendientes disponibles para hoy')
                  : (searchTerm 
                      ? 'No pending outputs found with applied filters' 
                      : 'No pending outputs available for today')
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMovements.map((movement, index) => {
                // Determine row color based on date
                const today = new Date().toISOString().split('T')[0]
                const movementDate = movement.date ? new Date(movement.date).toISOString().split('T')[0] : null
                const isToday = movementDate === today
                const isOlder = movementDate && movementDate !== today

                let rowClass = 'border border-slate-200 rounded-lg p-4 hover:border-crown-navy/30 hover:shadow-md transition-all'
                if (!movement.already_inspected) {
                  if (isToday) {
                    rowClass = 'border border-yellow-300 bg-yellow-50 rounded-lg p-4 hover:border-yellow-400 hover:shadow-md transition-all'
                  } else if (isOlder) {
                    rowClass = 'border border-red-300 bg-red-50 rounded-lg p-4 hover:border-red-400 hover:shadow-md transition-all'
                  }
                }

                return (
                <div
                  key={index}
                  className={rowClass}
                >
                  <div className={`flex items-start justify-between ${movement.already_inspected ? 'opacity-60' : ''}`}>
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedMovement(movement)}>
                      {/* Header */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-crown-navy" />
                          <span className="font-semibold text-crown-navy">
                            {movement.truck_id?.trim() || '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {movement.work_order?.trim() || '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {movement.driver_code?.trim() || '-'}
                          </span>
                        </div>
                        {/* Already inspected badge */}
                        {movement.already_inspected && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            {language === 'es' ? 'Ya inspeccionada' : 'Already inspected'}
                          </span>
                        )}
                        {/* Equipment type badge */}
                        {(() => {
                          const el = movement.equipment_type?.trim()
                          const eqp = movement.equipment_code?.trim() || ''
                          const eqpUpper = eqp.toUpperCase()

                          // Detectar tipo de equipo basado en eqpcode
                          let tipoEquipo = ''
                          if (eqp.includes('Botada') || eqp.includes('BOTADA')) {
                            tipoEquipo = 'BOTADO'
                          } else if (eqpUpper.startsWith('CXC') || /^[A-Z]{4}-\d{6}-\d$/.test(eqpUpper)) {
                            tipoEquipo = 'CONTENEDOR'
                          } else if (/^R\d{3}/.test(eqpUpper)) {
                            tipoEquipo = 'RABÓN' // R020, R### son prefijos de rabón
                          } else if (eqpUpper.startsWith('CXT') || eqpUpper.startsWith('ABBA') || eqpUpper.startsWith('RBX') || eqpUpper.startsWith('JGB')) {
                            tipoEquipo = 'CAJA'
                          } else if (/^D\d{5}/.test(eqpUpper)) {
                            tipoEquipo = 'CAJA'
                          } else {
                            tipoEquipo = 'CAJA'
                          }

                          // Color segun tipo
                          if (tipoEquipo === 'BOTADO') {
                            return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">BOTADO</span>
                          }
                          if (el === 'L') {
                            return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">{tipoEquipo} · CARGADO</span>
                          }
                          if (el === 'E') {
                            return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">{tipoEquipo} · VACIO</span>
                          }
                          return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">{tipoEquipo}</span>
                        })()}
                      </div>

                      {/* Details */}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(movement.fecha_raw || movement.date)}</span>
                        </div>
                        {movement.arrival_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{movement.arrival_time}</span>
                          </div>
                        )}
                        {movement.customer && (
                          <span>
                            {language === 'es' ? 'Cliente:' : 'Customer:'} {movement.customer.trim()}
                          </span>
                        )}
                        {movement.equipment_code && (
                          <span>
                            {language === 'es' ? 'Equipo:' : 'Equipment:'} {movement.equipment_code.trim()}
                          </span>
                        )}
                      </div>

                      {/* Instructions */}
                      {(movement.instructions_1 || movement.instructions_2) && (
                        <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                          <strong>{language === 'es' ? 'Instrucciones:' : 'Instructions:'}</strong>{' '}
                          {[movement.instructions_1, movement.instructions_2]
                            .filter(Boolean)
                            .join(' | ')
                            .trim()}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedMovement(movement)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {language === 'es' ? 'Ver detalles' : 'View details'}
                      </button>
                      <button
                        onClick={() => handleSelectMovement(movement)}
                        disabled={movement.already_inspected}
                        className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          movement.already_inspected
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-crown-navy text-white hover:bg-crown-navy/90'
                        }`}
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        {movement.already_inspected
                          ? (language === 'es' ? 'Ya inspeccionada' : 'Already inspected')
                          : (language === 'es' ? 'Inspeccionar' : 'Inspect')
                        }
                      </button>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <span>
              {language === 'es'
                ? `${filteredMovements.length} salida${filteredMovements.length !== 1 ? 's' : ''} mostrada${filteredMovements.length !== 1 ? 's' : ''}`
                : `${filteredMovements.length} output${filteredMovements.length !== 1 ? 's' : ''} shown`
              }
            </span>
            <span className="text-yellow-600 font-medium">
              {language === 'es'
                ? `Hoy: ${todayPendingCount}`
                : `Today: ${todayPendingCount}`
              }
            </span>
            <span className="text-red-600 font-medium">
              {language === 'es'
                ? `48hrs: ${olderPendingCount}`
                : `48hrs: ${olderPendingCount}`
              }
            </span>
            <span className="text-slate-600">
              {language === 'es'
                ? `Total: ${pendingCount}`
                : `Total: ${pendingCount}`
              }
            </span>
          </div>
          <button
            onClick={() => { loadMovements(true); setCountdown(60) }}
            disabled={refreshing}
            className="text-crown-navy hover:underline disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            {language === 'es' ? 'Actualizar' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedMovement && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-crown-navy flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {language === 'es' ? 'Detalles de la Salida' : 'Output Details'}
              </h3>
              <button
                onClick={() => setSelectedMovement(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* General info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                  {language === 'es' ? 'Información General' : 'General Information'}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailRow label={language === 'es' ? 'Orden de Trabajo' : 'Work Order'} value={selectedMovement.work_order} />
                  <DetailRow label={language === 'es' ? 'BL/Guía' : 'BL No.'} value={selectedMovement.bill_of_lading} />
                  <DetailRow label={language === 'es' ? 'Fecha' : 'Date'} value={selectedMovement.fecha_raw || selectedMovement.date} />
                  <DetailRow label={language === 'es' ? 'Tipo Movimiento' : 'Movement Type'} value={selectedMovement.movement_type} />
                  <DetailRow label={language === 'es' ? 'Estado' : 'Status'} value={selectedMovement.status} />
                  <DetailRow label={language === 'es' ? 'Operador' : 'Operator'} value={selectedMovement.operator} />
                </div>
              </div>

              {/* Equipment */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                  {language === 'es' ? 'Equipo y Vehículo' : 'Equipment & Vehicle'}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailRow label={language === 'es' ? 'Camión (Truck ID)' : 'Truck ID'} value={selectedMovement.truck_id} />
                  <DetailRow label={language === 'es' ? 'Código Conductor' : 'Driver Code'} value={selectedMovement.driver_code} />
                  <DetailRow label={language === 'es' ? 'Equipo' : 'Equipment'} value={selectedMovement.equipment_code} />
                  <DetailRow label={language === 'es' ? 'Tipo Equipo (EL)' : 'Equip. Type (EL)'} value={selectedMovement.equipment_type} />
                  <DetailRow label={language === 'es' ? 'Sello' : 'Seal'} value={selectedMovement.seal} />
                  <DetailRow label={language === 'es' ? 'Tabla Código' : 'Table Code'} value={selectedMovement.table_code} />
                </div>
              </div>

              {/* Customer & Instructions */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                  {language === 'es' ? 'Cliente e Instrucciones' : 'Customer & Instructions'}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailRow label={language === 'es' ? 'Cliente' : 'Customer'} value={selectedMovement.customer} />
                  <DetailRow label={language === 'es' ? 'Hora Arribo' : 'Arrival Time'} value={selectedMovement.arrival_time} />
                  <DetailRow label={language === 'es' ? 'Hora Salida' : 'Departure Time'} value={selectedMovement.departure_time} />
                </div>
                {(selectedMovement.instructions_1 || selectedMovement.instructions_2) && (
                  <div className="mt-3 p-2 bg-white rounded border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 uppercase">{language === 'es' ? 'Instrucciones' : 'Instructions'}</span>
                    <p className="text-sm text-slate-700 mt-1">
                      {[selectedMovement.instructions_1, selectedMovement.instructions_2].filter(Boolean).join(' | ').trim()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedMovement(null)}
                className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {language === 'es' ? 'Cerrar' : 'Close'}
              </button>
              <button
                onClick={() => {
                  handleSelectMovement(selectedMovement)
                  setSelectedMovement(null)
                }}
                className="flex-1 py-2.5 px-4 bg-crown-navy text-white rounded-lg hover:bg-crown-navy/90 transition-colors flex items-center justify-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                {language === 'es' ? 'Iniciar Inspección' : 'Start Inspection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
