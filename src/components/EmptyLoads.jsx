import { useState, useEffect } from 'react'
import { Search, Filter, Truck, Calendar, MapPin, Package, Clock, User, ArrowRight, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { getTprMovements } from '../utils/api'

export default function EmptyLoads({ onSelectMovement, onClose }) {
  console.log('EmptyLoads component rendered')
  const { t, language } = useLanguage()
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [filteredMovements, setFilteredMovements] = useState([])

  useEffect(() => {
    console.log('EmptyLoads useEffect triggered, loading movements...')
    loadMovements()
  }, [])

  useEffect(() => {
    filterMovements()
  }, [movements, searchTerm, selectedDate])

  const loadMovements = async () => {
    console.log('loadMovements called')
    try {
      setLoading(true)
      console.log('Calling getTprMovements with type: pending')
      const res = await getTprMovements({ type: 'pending' })
      console.log('getTprMovements response:', res)
      if (res.success) {
        console.log('Success, setting movements:', res.data)
        setMovements(res.data || [])
      } else {
        console.log('Error in response:', res)
        setError(language === 'es' ? 'Error al cargar salidas pendientes' : 'Error loading pending outputs')
      }
    } catch (err) {
      console.log('Exception in loadMovements:', err)
      setError(err.message || (language === 'es' ? 'Error de conexión' : 'Connection error'))
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  const filterMovements = () => {
    let filtered = [...movements]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(m => 
        m.work_order?.toLowerCase().includes(term) ||
        m.truck_id?.toLowerCase().includes(term) ||
        m.driver_code?.toLowerCase().includes(term) ||
        m.from_city?.toLowerCase().includes(term) ||
        m.to_city?.toLowerCase().includes(term) ||
        m.customer?.toLowerCase().includes(term)
      )
    }

    // Filtrar por fecha
    if (selectedDate) {
      filtered = filtered.filter(m => m.date === selectedDate)
    }

    setFilteredMovements(filtered)
  }

  const handleSelectMovement = (movement) => {
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
      equipmentCode: movement.equipment_code?.trim(),
      seal: movement.seal?.trim(),
      instructions: [movement.instructions_1, movement.instructions_2].filter(Boolean).join(' | '),
      arrivalTime: movement.arrival_time,
      departureTime: movement.departure_time,
      operator: movement.operator?.trim(),
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-crown-navy">
            {language === 'es' ? 'Salidas Pendientes NBCW' : 'NBCW Pending Outputs'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'es' ? 'Buscar salidas pendientes por orden, camión, conductor...' : 'Search pending outputs by order, truck, driver...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
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
                  ? (searchTerm || selectedDate 
                      ? 'No se encontraron salidas pendientes con los filtros aplicados' 
                      : 'No hay salidas pendientes disponibles')
                  : (searchTerm || selectedDate 
                      ? 'No pending outputs found with applied filters' 
                      : 'No pending outputs available')
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMovements.map((movement, index) => (
                <div
                  key={index}
                  className="border border-slate-200 rounded-lg p-4 hover:border-crown-navy/30 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleSelectMovement(movement)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-600">
                            {movement.from_city?.trim() || '-'}
                          </span>
                          <span className="text-slate-400">
                            {movement.from_state?.trim() || ''}
                          </span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-600">
                            {movement.to_city?.trim() || '-'}
                          </span>
                          <span className="text-slate-400">
                            {movement.to_state?.trim() || ''}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(movement.date)}</span>
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

                    <div className="ml-4">
                      <button className="px-3 py-1 bg-crown-navy text-white text-sm rounded-lg hover:bg-crown-navy/90 transition-colors">
                        {language === 'es' ? 'Inspeccionar' : 'Inspect'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <span>
            {language === 'es' 
              ? `${filteredMovements.length} salida${filteredMovements.length !== 1 ? 's' : ''} pendiente${filteredMovements.length !== 1 ? 's' : ''} encontrada${filteredMovements.length !== 1 ? 's' : ''}`
              : `${filteredMovements.length} pending output${filteredMovements.length !== 1 ? 's' : ''} found`
            }
          </span>
          <button
            onClick={loadMovements}
            className="text-crown-navy hover:underline"
          >
            {language === 'es' ? 'Actualizar' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  )
}
