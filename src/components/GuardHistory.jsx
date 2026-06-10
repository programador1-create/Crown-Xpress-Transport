import { useState, useEffect, useMemo } from 'react'
import { FileText, Search, Download, AlertTriangle, ChevronDown, ChevronRight, Lock, GitBranch, CheckCircle, X, Filter, Calendar, Truck, User, Tag, Eye } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { listInspections, downloadPdf, getInspection, reconfirmInspection } from '../utils/api'
import { generateInspectionPDF } from '../utils/pdfGenerator'
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
  const [successModal, setSuccessModal] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [pdfViewer, setPdfViewer] = useState({ open: false, url: null, filename: '' })
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    inspectionType: ''
  })

  useEffect(() => {
    load()
  }, [user])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await listInspections({ limit: 200 })
      // Only show inspections from current guard (case-insensitive comparison)
      const mine = (res.data || []).filter(i => 
        i.guard_name?.toLowerCase() === user?.full_name?.toLowerCase()
      )
      console.log('GuardHistory loaded:', res.data?.length, 'total,', mine.length, 'mine')
      setInspections(mine)
    } catch (err) {
      console.error('GuardHistory error:', err)
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

  const filteredGroups = groupedInspections.filter(g => {
    const orig = g.original
    
    // Text search
    const searchMatch = !search ||
      orig.trailer_number?.toLowerCase().includes(search.toLowerCase()) ||
      orig.driver_name?.toLowerCase().includes(search.toLowerCase()) ||
      orig.seal_number?.toLowerCase().includes(search.toLowerCase()) ||
      orig.location?.toLowerCase().includes(search.toLowerCase()) ||
      orig.guard_name?.toLowerCase().includes(search.toLowerCase())
    
    // Date filters
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null
    const dateTo = filters.dateTo ? new Date(filters.dateTo + 'T23:59:59') : null
    const inspDate = new Date(orig.created_at)
    const dateMatch = (!dateFrom || inspDate >= dateFrom) && (!dateTo || inspDate <= dateTo)
    
    // Status filter
    const statusMatch = !filters.status || orig.status === filters.status
    
    // Inspection type filter
    const typeMatch = !filters.inspectionType || orig.inspection_type === filters.inspectionType
    
    return searchMatch && dateMatch && statusMatch && typeMatch
  })
  
  // Clear all filters
  const clearFilters = () => {
    setSearch('')
    setFilters({ dateFrom: '', dateTo: '', status: '', inspectionType: '' })
  }
  
  const hasActiveFilters = search || filters.dateFrom || filters.dateTo || filters.status || filters.inspectionType

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const handleDownload = async (id, filename) => {
    try {
      const blob = await downloadPdf(id)
      if (blob.size === 0) {
        throw new Error('PDF vacío')
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `inspection-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('PDF download error:', e)
      alert(language === 'es' 
        ? 'Error descargando PDF. Esta inspección puede no tener PDF guardado.' 
        : 'Error downloading PDF. This inspection may not have a saved PDF.')
    }
  }

  const handleViewPdf = async (id, filename) => {
    try {
      const blob = await downloadPdf(id)
      if (blob.size === 0) {
        throw new Error('PDF vacío')
      }
      const url = URL.createObjectURL(blob)
      setPdfViewer({ open: true, url, filename: filename || `inspection-${id}.pdf` })
    } catch (e) {
      console.error('PDF view error:', e)
      alert(language === 'es' 
        ? 'Error abriendo PDF. Esta inspección puede no tener PDF guardado.' 
        : 'Error opening PDF. This inspection may not have a saved PDF.')
    }
  }

  const closePdfViewer = () => {
    if (pdfViewer.url) {
      URL.revokeObjectURL(pdfViewer.url)
    }
    setPdfViewer({ open: false, url: null, filename: '' })
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
      // Generate PDF for reconfirmation
      const pdfResult = await generateInspectionPDF({
        unitInfo: data.unitInfo,
        points: data.points,
        sealPhoto: data.sealPhoto,
        guardSignature: data.guardSignature,
        auditorSignature: data.auditorSignature,
        operatorSignature: null,
        language: data.language || language
      })

      // Convert PDF to base64
      const pdfBlob = pdfResult.doc.output('blob')
      const pdfBase64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(pdfBlob)
      })

      // Add PDF data to the request
      const dataWithPdf = {
        ...data,
        pdfBase64,
        pdfFilename: pdfResult.filename
      }

      const result = await reconfirmInspection(data.original_inspection_id, dataWithPdf)
      setReconfirmTarget(null)
      setSuccessModal({
        id: result.id,
        modifications: result.modifications || 0,
        originalId: data.original_inspection_id
      })
      load()
    } catch (e) {
      console.error('Reconfirm error:', e)
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
                {language === 'es' ? 'MI HISTORIAL' : 'MY HISTORY'}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3" />
                {language === 'es' ? 'SOLO LECTURA · NO SE PUEDE EDITAR NI BORRAR' : 'READ ONLY · CANNOT EDIT OR DELETE'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={language === 'es' ? 'BUSCAR...' : 'SEARCH...'}
                className="pl-9 pr-3 py-1.5 w-48 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20 uppercase"
              />
            </div>
            {/* Filter toggle button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-crown-navy text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {language === 'es' ? 'FILTROS' : 'FILTERS'}
              {hasActiveFilters && (
                <span className="w-4 h-4 bg-crown-gold text-crown-navy rounded-full text-[10px] flex items-center justify-center font-bold">
                  !
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Date From */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">
                  {language === 'es' ? 'DESDE' : 'FROM'}
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
                />
              </div>
              {/* Date To */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">
                  {language === 'es' ? 'HASTA' : 'TO'}
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
                />
              </div>
              {/* Status */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">
                  {language === 'es' ? 'ESTADO' : 'STATUS'}
                </label>
                <select
                  value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20 uppercase"
                >
                  <option value="">{language === 'es' ? 'TODOS' : 'ALL'}</option>
                  <option value="completed">{language === 'es' ? 'COMPLETADO' : 'COMPLETED'}</option>
                  <option value="pending">{language === 'es' ? 'PENDIENTE' : 'PENDING'}</option>
                </select>
              </div>
              {/* Inspection Type */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">
                  {language === 'es' ? 'TIPO' : 'TYPE'}
                </label>
                <select
                  value={filters.inspectionType}
                  onChange={e => setFilters(f => ({ ...f, inspectionType: e.target.value }))}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20 uppercase"
                >
                  <option value="">{language === 'es' ? 'TODOS' : 'ALL'}</option>
                  <option value="LOADED">{language === 'es' ? 'CARGADO' : 'LOADED'}</option>
                  <option value="EMPTY">{language === 'es' ? 'VACÍO' : 'EMPTY'}</option>
                  <option value="BOBTAIL">{language === 'es' ? 'BOTADO' : 'BOBTAIL'}</option>
                </select>
              </div>
            </div>
            {/* Clear filters button */}
            {hasActiveFilters && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <X className="w-3 h-3" />
                  {language === 'es' ? 'LIMPIAR FILTROS' : 'CLEAR FILTERS'}
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Results count */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
          {filteredGroups.length} {language === 'es' ? 'INSPECCIONES ENCONTRADAS' : 'INSPECTIONS FOUND'}
          {hasActiveFilters && ` (${language === 'es' ? 'FILTRADO' : 'FILTERED'})`}
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
                      {/* View PDF button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewPdf(group.original.id, group.original.pdf_filename) }}
                        className="p-1.5 rounded hover:bg-slate-100"
                        title={language === 'es' ? 'Ver PDF' : 'View PDF'}
                      >
                        <Eye className="w-4 h-4 text-crown-navy" />
                      </button>
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

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {language === 'es' ? '¡Reconfirmación Exitosa!' : 'Reconfirmation Successful!'}
              </h2>
            </div>
            
            {/* Body */}
            <div className="px-6 py-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-slate-600">
                    {language === 'es' ? 'ID de Reconfirmación' : 'Reconfirmation ID'}
                  </span>
                  <span className="font-bold text-emerald-600 text-lg">#{successModal.id}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-slate-600">
                    {language === 'es' ? 'Inspección Original' : 'Original Inspection'}
                  </span>
                  <span className="font-semibold text-slate-800">#{successModal.originalId}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-slate-600">
                    {language === 'es' ? 'Puntos Corregidos' : 'Points Corrected'}
                  </span>
                  <span className="font-bold text-amber-600 text-lg">{successModal.modifications}</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-sm text-emerald-700 text-center">
                  {language === 'es' 
                    ? 'La reconfirmación ha sido registrada correctamente en el sistema.' 
                    : 'The reconfirmation has been successfully recorded in the system.'}
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setSuccessModal(null)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {language === 'es' ? 'ACEPTAR' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {pdfViewer.open && pdfViewer.url && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-crown-navy to-crown-navy-dark px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-crown-gold" />
              <div>
                <h3 className="font-bold text-white text-lg">
                  {language === 'es' ? 'VISOR DE PDF' : 'PDF VIEWER'}
                </h3>
                <p className="text-crown-gold text-sm">{pdfViewer.filename}</p>
              </div>
            </div>
            <button
              onClick={closePdfViewer}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
              <span>{language === 'es' ? 'Cerrar' : 'Close'}</span>
            </button>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-hidden">
            <iframe
              src={pdfViewer.url}
              className="w-full h-full border-0"
              title="PDF Viewer"
            />
          </div>
        </div>
      )}
    </>
  )
}
