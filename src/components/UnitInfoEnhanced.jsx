import { useEffect } from 'react'
import { MapPin, Calendar, User, Tag, Lock } from 'lucide-react'
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

export default function UnitInfoEnhanced() {
  const { t, language } = useLanguage()
  const { unitInfo, setUnitInfo } = useInspection()
  const { user } = useAuth()

  // Auto-fill date and guard name on mount
  useEffect(() => {
    setUnitInfo(prev => ({
      ...prev,
      inspection_date: new Date().toISOString().split('T')[0],
      guard_name: user?.full_name || '',
      location: user?.location_id ? YARDS.find(y => y.id === user.location_id)?.name || '' : '',
    }))
  }, [user, setUnitInfo])

  const update = (field, value) => {
    setUnitInfo(prev => ({ ...prev, [field]: value }))
  }

  const validateField = (field) => {
    if (!unitInfo[field] || unitInfo[field].trim() === '') {
      return 'border-rose-400 focus:border-rose-500'
    }
    return 'border-slate-200 focus:border-crown-navy'
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
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {t('trailerNumber')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={unitInfo.trailer_number || ''}
              onChange={e => update('trailer_number', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20 ${validateField('trailer_number')}`}
              placeholder={language === 'es' ? 'Ej: T-12345' : 'Ex: T-12345'}
              required
            />
          </div>

          {/* Seal Number */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {t('sealNumber')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={unitInfo.seal_number || ''}
              onChange={e => update('seal_number', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20 ${validateField('seal_number')}`}
              placeholder={language === 'es' ? 'Ej: S-98765' : 'Ex: S-98765'}
              required
            />
          </div>

          {/* Lock Number */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {language === 'es' ? 'Número de Candado (si aplica)' : 'Lock Number (if applicable)'}
            </label>
            <input
              type="text"
              value={unitInfo.lock_number || ''}
              onChange={e => update('lock_number', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
              placeholder={language === 'es' ? 'Ej: L-54321' : 'Ex: L-54321'}
            />
          </div>

          {/* Operator Name */}
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3 h-3" />
              {t('driverName')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={unitInfo.driver_name || ''}
              onChange={e => update('driver_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20 ${validateField('driver_name')}`}
              placeholder={language === 'es' ? 'Nombre completo del operador' : 'Operator full name'}
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {t('date')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={unitInfo.inspection_date || ''}
              onChange={e => update('inspection_date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20 ${validateField('inspection_date')}`}
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {language === 'es' ? 'Ubicación (Yarda)' : 'Location'} <span className="text-rose-500">*</span>
            </label>
            <select
              value={unitInfo.location || ''}
              onChange={e => update('location', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20 ${validateField('location')}`}
              required
            >
              <option value="">{language === 'es' ? 'Seleccione...' : 'Select...'}</option>
              {YARDS.map(yard => (
                <option key={yard.id} value={yard.name}>{yard.name}</option>
              ))}
            </select>
          </div>

          {/* Guard Name (readonly) */}
          <div className="col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3 h-3" />
              {language === 'es' ? 'Guardia' : 'Guard'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={unitInfo.guard_name || ''}
              readOnly
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
              placeholder={language === 'es' ? 'Asignado automáticamente' : 'Auto-assigned'}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            {t('notes')} ({language === 'es' ? 'opcional' : 'optional'})
          </label>
          <textarea
            value={unitInfo.notes || ''}
            onChange={e => update('notes', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20 resize-none"
            rows={2}
            placeholder={language === 'es' ? 'Notas adicionales...' : 'Additional notes...'}
          />
        </div>
      </div>
    </section>
  )
}
