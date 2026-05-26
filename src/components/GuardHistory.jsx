import { useState, useEffect, useMemo } from 'react'
import { FileText, Search, Download, AlertTriangle, ChevronDown, ChevronRight, Lock, GitBranch } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { listInspections, downloadPdf, getInspection, reconfirmInspection } from '../utils/api'
import AuditTrail from './AuditTrail'
import ReconfirmModal from './ReconfirmModal'

/**
 * GuardHistory: read-only history of inspections done by the current guard.
 * Guard cannot edit/delete. Can only create reconfirmations linked to original.
 * Shows original and reconfirmations side by side.
 */
export default function GuardHistory() {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [search, setSearch] = useState('')
  const [reconfirmTarget, setReconfirmTarget] = useState(null)

  useEffect(() => {
    load()
  }, [user])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await listInspections({ limit: 200 })
      // Only show inspections from current guard
      const mine = (res.data || []).filter(i => i.guard_name === user?.full_name)
      setInspections(mine)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Group inspections: originals with their reconfirmations
  const groupedInspections = useMemo(() => {
    const originals = inspections.filter(i => !i.original_inspection_id)
    const reconfirms = inspections.filter(i => i.original_inspection_id)
    
    return originals.map(orig => ({
      original: orig,
      // Compare as numbers to handle type mismatches
      reconfirmations: reconfirms.filter(r => Number(r.original_inspection_id) === Number(orig.id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }))
  }, [inspections])

  const filteredGroups = groupedInspections.filter(g =>
    !search ||
    g.original.trailer_number?.toLowerCase().includes(search.toLowerCase()) ||
    g.original.driver_name?.toLowerCase().includes(search.toLowerCase()) ||
    g.original.seal_number?.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const handleDownload = async (id, filename) => {
    try {
      const blob = await downloadPdf(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `inspection-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(language === 'es' ? 'Error descargando PDF' : 'Error downloading PDF')
    }
  }

  const handleReconfirm = async (id) => {
    try {
      const full = await getInspection(id)
      setReconfirmTarget(full)
    } catch (e) {
      alert(language === 'es' ? 'Error cargando inspección' : 'Error loading inspection')
    }
  }

  const handleReconfirmSubmit = async (data) => {
    try {
      const result = await reconfirmInspection(data.original_inspection_id, data)
      alert(
        language === 'es'
          ? `Reconfirmación creada exitosamente (ID #${result.id}, ${result.modifications} puntos corregidos)`
          : `Reconfirmation created (ID #${result.id}, ${result.modifications} points corrected)`
      )
      setReconfirmTarget(null)
      load()
    } catch (e) {
      alert(
        language === 'es'
          ? `Error: ${e.message}`
          : `Error: ${e.message}`
      )
    }
  }

  if (loading) {
    return (
      <section className="card">
        <div className="card-body text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-crown-navy/30 border-t-crown-navy rounded-full mx-auto mb-3" />
          <p className="text-slate-500">{language === 'es' ? 'Cargando mi historial...' : 'Loading my history...'}</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="card">
        <div className="card-body text-center py-12 text-rose-600">
          <p>{error}</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="card animate-slide-up">
        <div className="card-header flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-crown-gold" />
            <div>
              <h2 className="font-bold uppercase text-sm tracking-wide">
                {language === 'es' ? 'Mi Historial' : 'My History'}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3" />
                {language === 'es' ? 'Solo lectura · No se puede editar ni borrar' : 'Read only · Cannot edit or delete'}
              </p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={language === 'es' ? 'Buscar trailer, sello...' : 'Search trailer, seal...'}
              className="pl-9 pr-3 py-1.5 w-56 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
            />
          </div>
        </div>
        <div className="card-body">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3" />
              <p>{search ? (language === 'es' ? 'Sin resultados' : 'No results') : (language === 'es' ? 'Sin inspecciones aún' : 'No inspections yet')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGroups.map(group => (
                <div key={group.original.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  {/* Header - Click to expand */}
                  <div
                    className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                    onClick={() => toggle(group.original.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {expanded[group.original.id] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">
                          {group.original.trailer_number || '—'} · {group.original.guard_name || group.original.driver_name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {new Date(group.original.created_at).toLocaleString()} · {group.original.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Status badge */}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        group.original.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {group.original.status === 'completed' ? (language === 'es' ? 'Completado' : 'Completed') : group.original.status}
                      </span>
                      {/* Download button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(group.original.id, group.original.pdf_filename) }}
                        className="p-1.5 rounded hover:bg-slate-100"
                        title={language === 'es' ? 'Descargar PDF' : 'Download PDF'}
                      >
                        <Download className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {expanded[group.original.id] && (
                    <div className="border-t bg-slate-50">
                      {/* Stats */}
                      <div className="px-4 py-3 grid grid-cols-3 gap-2 text-center border-b">
                        <div className="bg-emerald-50 rounded-lg py-2">
                          <div className="text-lg font-bold text-emerald-600">{group.original.good_count || 0}</div>
                          <div className="text-xs text-emerald-700">{language === 'es' ? 'Buenos' : 'Good'}</div>
                        </div>
                        <div className="bg-rose-50 rounded-lg py-2">
                          <div className="text-lg font-bold text-rose-600">{group.original.bad_count || 0}</div>
                          <div className="text-xs text-rose-700">{language === 'es' ? 'Malos' : 'Bad'}</div>
                        </div>
                        <div className="bg-slate-100 rounded-lg py-2">
                          <div className="text-lg font-bold text-slate-600">{group.original.pending_count || 0}</div>
                          <div className="text-xs text-slate-700">{language === 'es' ? 'Pendientes' : 'Pending'}</div>
                        </div>
                      </div>

                      {/* Reconfirmations list */}
                      {group.reconfirmations.length > 0 && (
                        <div className="px-4 py-3 border-b">
                          <h4 className="text-xs font-bold text-amber-700 uppercase mb-2 flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {language === 'es' ? 'Reconfirmaciones' : 'Reconfirmations'} ({group.reconfirmations.length})
                          </h4>
                          <div className="space-y-2">
                            {group.reconfirmations.map((reconf, idx) => (
                              <div key={reconf.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                                <div>
                                  <div className="text-sm font-medium text-amber-800">
                                    #{idx + 1} - {new Date(reconf.created_at).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-amber-600">
                                    ✅ {reconf.good_count || 0} · ❌ {reconf.bad_count || 0}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDownload(reconf.id, reconf.pdf_filename) }}
                                  className="p-1.5 rounded hover:bg-amber-100"
                                >
                                  <Download className="w-4 h-4 text-amber-600" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reconfirmation button */}
                      <div className="px-4 py-3">
                        <button
                          onClick={() => handleReconfirm(group.original.id)}
                          className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          {language === 'es' ? 'Crear Reconfirmación (corregir puntos)' : 'Create Reconfirmation (correct points)'}
                        </button>
                        <p className="text-xs text-slate-500 text-center mt-2">
                          {language === 'es'
                            ? 'Crea un nuevo registro vinculado. Los datos originales no se modifican.'
                            : 'Creates a new linked record. Original data is preserved.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reconfirm Modal */}
      <ReconfirmModal
        open={!!reconfirmTarget}
        originalInspection={reconfirmTarget}
        onClose={() => setReconfirmTarget(null)}
        onSubmit={handleReconfirmSubmit}
      />
    </>
  )
}
