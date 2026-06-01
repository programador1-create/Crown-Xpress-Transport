import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'
import { inspectionPoints } from '../data/inspectionPoints'
import truckImage from '../assets/Gemini_Generated_Image_nwvt4xnwvt4xnwvt.jpg'

// Position definitions for each inspection point on the truck diagram
// Positions are in percentages relative to the image container
// Based on the truck diagram image layout:
// - Top left: Front view of tractor (CAB-AREA)
// - Top center: Side view of full truck (tractor + trailer)
// - Top right: Rear view of trailer (TRAILER-REAR)
// - Bottom left: Rear views of tractor cab
// - Bottom center: Side view of trailer only (TRAILER BODY)
const pointPositions = [
  // TRACTOR POINTS (1-10) - Based on top views
  { id: 1, x: 13, y: 38, label: 'Defensa' },           // Bumper - front of tractor (top-left view)
  { id: 2, x: 28.5, y: 38, label: 'Llantas' },           // Tires - tractor section (bottom-left)
  { id: 3, x: 38, y: 47, label: 'Piso' },               // Floor - tractor cab (bottom-left)
  { id: 4, x: 42.5, y: 47, label: 'Tanques Diesel' },    // Fuel tanks - side of tractor
  { id: 5, x: 26.5, y: 12, label: 'Cabina' },            // Cab compartments - top of cab area
  { id: 6, x: 40.2, y: 16, label: 'Tanques Aire' },      // Air tanks - under chassis
  { id: 7, x: 47, y: 27, label: 'Quinta Rueda' },      // Fifth wheel - connection area
  { id: 8, x: 55, y: 45, label: 'Ejes Trans.' },       // Drive shafts - bottom view
  { id: 9, x: 12, y: 13.5, label: 'Escape' },            // Exhaust - side of cab
  { id: 10, x: 12, y: 24.2, label: 'Motor' },            // Engine/Battery - front cab area
  
  // TRAILER POINTS (11-20)
  { id: 11, x: 55.2, y: 26, label: 'Base Remolque' },    // Undercarriage - bottom trailer view
  { id: 12, x: 19.5, y: 87, label: 'Puertas' },          // Doors - rear view (right side)
  { id: 13, x: 91, y: 89, label: 'Pared Der.' },       // Right side wall - bottom view
  { id: 14, x: 85.6, y: 8, label: 'Techo' },            // Roof - top of trailer body
  { id: 15, x: 86.2, y: 89, label: 'Pared Frontal' },    // Front wall - near reefer
  { id: 16, x: 81.5, y: 89, label: 'Pared Izq.' },       // Left side wall - trailer body
  { id: 17, x: 85.5, y: 55, label: 'Piso Interior' },    // Interior floor - bottom view
  { id: 18, x: 55.5, y: 88, label: 'Patín' },            // Landing gear - chassis section
  { id: 19, x: 50, y: 10, label: 'Refrigeración' },    // Reefer unit - top view
  { id: 20, x: 9.2, y: 87, label: 'Limpieza' },         // Cleanliness - rear of trailer body
]

export default function TruckDiagramVisual({ onPointClick, compact = false }) {
  const { language } = useLanguage()
  const { points } = useInspection()

  const getPointStatus = (pointId) => {
    const point = points[pointId]
    return point?.status || 'pending'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'good':
        return 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200'
      case 'bad':
        return 'bg-rose-500 border-rose-600 text-white shadow-rose-200'
      default:
        return 'bg-slate-400 border-slate-500 text-white shadow-slate-200'
    }
  }

  const getStatusRing = (status) => {
    switch (status) {
      case 'good':
        return 'ring-emerald-400'
      case 'bad':
        return 'ring-rose-400'
      default:
        return 'ring-slate-300'
    }
  }

  const handlePointClick = (pointId) => {
    if (onPointClick) {
      onPointClick(pointId)
    }
  }

  // Get point label based on language
  const getPointLabel = (pointId) => {
    const point = inspectionPoints.find(p => p.id === pointId)
    return point ? (language === 'es' ? point.es : point.en) : ''
  }

  return (
    <div className={`relative w-full ${compact ? 'max-w-4xl' : 'max-w-6xl'} mx-auto`}>
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-600"></div>
          <span className="text-slate-600">{language === 'es' ? 'Bueno' : 'Good'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-rose-500 border-2 border-rose-600"></div>
          <span className="text-slate-600">{language === 'es' ? 'Malo' : 'Bad'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-slate-400 border-2 border-slate-500"></div>
          <span className="text-slate-600">{language === 'es' ? 'Pendiente' : 'Pending'}</span>
        </div>
      </div>

      {/* Truck Diagram Container */}
      <div className="relative bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-lg">
        {/* Background Image */}
        <img 
          src={truckImage} 
          alt="Truck Diagram" 
          className="w-full h-auto"
          draggable={false}
        />
        
        {/* Inspection Points Overlay */}
        <div className="absolute inset-0">
          {pointPositions.map((pos) => {
            const status = getPointStatus(pos.id)
            const statusColor = getStatusColor(status)
            const statusRing = getStatusRing(status)
            const fullLabel = getPointLabel(pos.id)
            
            return (
              <div
                key={pos.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                {/* Point Circle */}
                <button
                  onClick={() => handlePointClick(pos.id)}
                  className={`
                    relative z-10 flex items-center justify-center
                    ${compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'}
                    rounded-full border-2 font-bold
                    ${statusColor}
                    shadow-lg ring-2 ${statusRing} ring-offset-1
                    hover:scale-110 hover:ring-4
                    transition-all duration-200 cursor-pointer
                  `}
                  title={fullLabel}
                >
                  {pos.id}
                </button>
                
                {/* Tooltip Label */}
                <div className={`
                  absolute left-1/2 -translate-x-1/2 
                  ${compact ? '-bottom-6' : '-bottom-7'}
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  pointer-events-none z-20
                `}>
                  <div className={`
                    bg-slate-800 text-white px-2 py-1 rounded-md
                    text-xs whitespace-nowrap shadow-lg
                  `}>
                    {pos.label}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-600">
            {Object.values(points).filter(p => p.status === 'good').length}
          </span>
          <span className="text-slate-500">{language === 'es' ? 'Buenos' : 'Good'}</span>
        </div>
        <div className="w-px h-4 bg-slate-300"></div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-rose-600">
            {Object.values(points).filter(p => p.status === 'bad').length}
          </span>
          <span className="text-slate-500">{language === 'es' ? 'Malos' : 'Bad'}</span>
        </div>
        <div className="w-px h-4 bg-slate-300"></div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">
            {20 - Object.values(points).filter(p => p.status === 'good' || p.status === 'bad').length}
          </span>
          <span className="text-slate-500">{language === 'es' ? 'Pendientes' : 'Pending'}</span>
        </div>
      </div>
    </div>
  )
}
