import { useState, useEffect } from 'react'
import { Search, ArrowRight, Clock, MapPin, Package, User, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getNbcwOutputs, createInspectionFromNbcw } from '../utils/api'

export default function NbcwOutputs() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [outputs, setOutputs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOutput, setSelectedOutput] = useState(null)
  const [creatingInspection, setCreatingInspection] = useState(false)

  useEffect(() => {
    loadOutputs()
  }, [])

  const loadOutputs = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getNbcwOutputs()
      if (res.success) {
        setOutputs(res.outputs || [])
      } else {
        setError(res.error || 'Failed to load outputs')
      }
    } catch (err) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const filteredOutputs = outputs.filter(output => 
    output.workOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    output.billOfLadingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    output.truckId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    output.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    output.fromCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    output.toCity?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateInspection = async (output) => {
    try {
      setCreatingInspection(true)
      setSelectedOutput(output)
      
      const res = await createInspectionFromNbcw(output.id)
      if (res.success) {
        // Navigate to inspection with pre-filled data
        navigate(`/inspection/${res.inspection.uuid}`, { 
          state: { 
            prefillData: res.inspection.unitInfo,
            fromNbcw: true 
          } 
        })
      } else {
        alert(res.error || 'Failed to create inspection')
      }
    } catch (err) {
      alert(err.message || 'Error creating inspection')
    } finally {
      setCreatingInspection(false)
      setSelectedOutput(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'pendiente':
        return 'bg-amber-100 text-amber-700'
      case 'completed':
      case 'completado':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return language === 'es' ? 'Pendiente' : 'Pending'
      case 'pendiente':
        return 'Pendiente'
      case 'completed':
        return language === 'es' ? 'Completado' : 'Completed'
      case 'completado':
        return 'Completado'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-crown-navy via-crown-navy/90 to-crown-gold/20 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p>{language === 'es' ? 'Cargando salidas NBCW...' : 'Loading NBCW outputs...'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-crown-navy via-crown-navy/90 to-crown-gold/20 flex items-center justify-center">
        <div className="text-white text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2">{language === 'es' ? 'Error' : 'Error'}</h2>
          <p className="text-white/80 mb-4">{error}</p>
          <button
            onClick={loadOutputs}
            className="px-4 py-2 bg-crown-gold text-crown-navy rounded-lg font-semibold hover:bg-crown-gold/90"
          >
            {language === 'es' ? 'Reintentar' : 'Retry'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-crown-navy mb-2">
                {language === 'es' ? 'Salidas NBCW' : 'NBCW Outputs'}
              </h1>
              <p className="text-slate-600">
                {language === 'es' 
                  ? `Salidas pendientes para ${user?.full_name || user?.username}` 
                  : `Pending outputs for ${user?.full_name || user?.username}`
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-500">
                {language === 'es' ? 'Total:' : 'Total:'} {outputs.length}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'es' 
                  ? 'Buscar por orden, BL, camión, cliente, ciudad...' 
                  : 'Search by order, BL, truck, customer, city...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-gold focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Outputs List */}
        {filteredOutputs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {searchTerm 
                ? (language === 'es' ? 'No se encontraron salidas' : 'No outputs found')
                : (language === 'es' ? 'No hay salidas pendientes' : 'No pending outputs')
              }
            </h3>
            <p className="text-slate-600">
              {searchTerm
                ? (language === 'es' ? 'Intenta con otros términos de búsqueda' : 'Try different search terms')
                : (language === 'es' ? 'No tienes salidas NBCW pendientes' : 'You have no pending NBCW outputs')
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOutputs.map((output) => (
              <div key={output.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-crown-navy">
                        {output.workOrderNumber || 'N/A'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(output.status)}`}>
                        {getStatusText(output.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">BL:</span>
                        <span className="font-medium">{output.billOfLadingNumber || 'N/A'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{language === 'es' ? 'Cond:' : 'Driver:'}</span>
                        <span className="font-medium">{output.driverCode || 'N/A'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{language === 'es' ? 'Camión:' : 'Truck:'}</span>
                        <span className="font-medium">{output.truckId || 'N/A'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{language === 'es' ? 'De:' : 'From:'}</span>
                        <span className="font-medium">
                          {output.fromCity && output.fromState 
                            ? `${output.fromCity}, ${output.fromState}`
                            : 'N/A'
                          }
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{language === 'es' ? 'A:' : 'To:'}</span>
                        <span className="font-medium">
                          {output.toCity && output.toState 
                            ? `${output.toCity}, ${output.toState}`
                            : 'N/A'
                          }
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{language === 'es' ? 'Fecha:' : 'Date:'}</span>
                        <span className="font-medium">{output.date || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Customer and Movement Type */}
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <div>
                        <span className="text-slate-600">{language === 'es' ? 'Cliente:' : 'Customer:'}</span>
                        <span className="ml-1 font-medium">{output.customer || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">{language === 'es' ? 'Movimiento:' : 'Movement:'}</span>
                        <span className="ml-1 font-medium">{output.movementType || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Instructions */}
                    {(output.instructions1 || output.instructions2) && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                        <div className="text-sm">
                          {output.instructions1 && (
                            <div className="text-amber-800">{output.instructions1}</div>
                          )}
                          {output.instructions2 && (
                            <div className="text-amber-800 mt-1">{output.instructions2}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex lg:justify-end">
                    <button
                      onClick={() => handleCreateInspection(output)}
                      disabled={creatingInspection && selectedOutput?.id === output.id}
                      className="flex items-center gap-2 px-6 py-3 bg-crown-navy text-white rounded-lg font-semibold hover:bg-crown-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {creatingInspection && selectedOutput?.id === output.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{language === 'es' ? 'Creando...' : 'Creating...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{language === 'es' ? 'Iniciar Inspección' : 'Start Inspection'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
