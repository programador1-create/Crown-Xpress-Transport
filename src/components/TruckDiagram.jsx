import { Construction, Truck } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function TruckDiagram() {
  const { t } = useLanguage()

  return (
    <section className="card animate-slide-up">
      <div className="card-header flex items-center gap-3">
        <Truck className="w-5 h-5 text-crown-gold" />
        <h2 className="font-bold tracking-wide uppercase text-sm">{t('truckDiagram')}</h2>
      </div>
      <div className="card-body">
        <div className="relative aspect-[16/6] rounded-xl border-2 border-dashed border-crown-navy/20 bg-gradient-to-br from-slate-50 via-white to-amber-50/40 flex flex-col items-center justify-center p-8 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-300 tracking-wider">
            CROWN-XPRESS · DIAGRAM-PLACEHOLDER
          </div>
          <div className="absolute bottom-4 right-4 text-[10px] font-mono text-slate-300">
            v1.0 · WIP
          </div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(#1e5b7a 1px, transparent 1px), linear-gradient(90deg, #1e5b7a 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />

          {/* Center content */}
          <div className="relative flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-crown-gold/20 to-crown-navy/20 flex items-center justify-center">
                <Construction className="w-10 h-10 text-crown-navy" />
              </div>
              <div className="absolute -inset-2 rounded-full border-2 border-crown-gold/30 animate-pulse-soft" />
            </div>
            <h3 className="text-lg font-bold text-crown-navy-dark mb-1">
              {t('diagramComing')}
            </h3>
            <p className="text-sm text-slate-500 max-w-md">
              {t('diagramHint')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
