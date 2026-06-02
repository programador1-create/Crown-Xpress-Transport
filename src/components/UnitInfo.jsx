import { Truck, Hash, User, Calendar, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useInspection } from '../context/InspectionContext'

export default function UnitInfo() {
  const { t } = useLanguage()
  const { unitInfo, updateUnitInfo } = useInspection()

  const fields = [
    { id: 'trailerNumber', label: t('trailerNumber'), icon: Truck, type: 'text', placeholder: 'TRL-12345' },
    { id: 'sealNumber', label: t('sealNumber'), icon: Hash, type: 'text', placeholder: 'SEAL-00001' },
    { id: 'driverName', label: t('driverName'), icon: User, type: 'text', placeholder: 'Juan Pérez' },
    { id: 'inspectionDate', label: t('inspectionDate'), icon: Calendar, type: 'datetime-local' },
    { id: 'location', label: t('location'), icon: MapPin, type: 'text', placeholder: 'Tijuana, B.C.' },
  ]

  return (
    <section className="card animate-slide-up">
      <div className="card-header flex items-center gap-3">
        <Truck className="w-5 h-5 text-crown-gold" />
        <h2 className="font-bold tracking-wide uppercase text-sm">{t('unitInfo')}</h2>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(field => (
            <div key={field.id}>
              <label className="label flex items-center gap-1.5">
                <field.icon className="w-3.5 h-3.5 text-crown-navy" />
                {field.label}
              </label>
              <input
                type={field.type}
                value={unitInfo[field.id]}
                onChange={(e) => updateUnitInfo(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="input"
              />
            </div>
          ))}
        </div>

        {/* Yes/No questions */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 border-t border-slate-100">
          <YesNoField
            id="highSecuritySeal"
            label={t('highSecuritySeal')}
            icon={ShieldCheck}
            value={unitInfo.highSecuritySeal}
            onChange={(v) => updateUnitInfo('highSecuritySeal', v)}
            yesLabel={t('yes')}
            noLabel={t('no')}
          />
          <YesNoField
            id="sealAffixed"
            label={t('sealAffixed')}
            icon={CheckCircle2}
            value={unitInfo.sealAffixed}
            onChange={(v) => updateUnitInfo('sealAffixed', v)}
            yesLabel={t('yes')}
            noLabel={t('no')}
          />
        </div>
      </div>
    </section>
  )
}

function YesNoField({ label, icon: Icon, value, onChange, yesLabel, noLabel }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-crown-navy" />
        {label}
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('yes')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold border-2 transition-colors ${
            value === 'yes'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
          }`}
        >
          {yesLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange('no')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold border-2 transition-colors ${
            value === 'no'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300'
          }`}
        >
          {noLabel}
        </button>
      </div>
    </div>
  )
}
