import { Truck } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import TruckDiagramVisual from './TruckDiagramVisual'

export default function TruckDiagram({ onPointClick }) {
  const { t } = useLanguage()

  return (
    <section className="card animate-slide-up">
      <div className="card-header flex items-center gap-3">
        <Truck className="w-5 h-5 text-crown-gold" />
        <h2 className="font-bold tracking-wide uppercase text-sm">{t('truckDiagram')}</h2>
      </div>
      <div className="card-body p-4">
        <TruckDiagramVisual onPointClick={onPointClick} />
      </div>
    </section>
  )
}
