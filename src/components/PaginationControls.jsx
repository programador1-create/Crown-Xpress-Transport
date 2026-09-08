import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

/**
 * Controles de paginación reutilizables.
 * Muestra: selector de page size (15/25/50) + botones de navegación.
 *
 * @param {number} page - Página actual (1-based)
 * @param {number} pageSize - Registros por página
 * @param {number} total - Total de registros
 * @param {number} totalPages - Total de páginas
 * @param {function} setPage - Setter para cambiar página
 * @param {function} setPageSize - Setter para cambiar page size
 * @param {array} pageSizes - Opciones de page size [15, 25, 50]
 */
export default function PaginationControls({
  page,
  pageSize,
  total,
  totalPages,
  setPage,
  setPageSize,
  pageSizes = [15, 25, 50],
}) {
  if (total === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Mostrando</span>
        <span className="font-semibold text-slate-800">{start}-{end}</span>
        <span>de</span>
        <span className="font-semibold text-slate-800">{total}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Page size selector */}
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-slate-500 hidden sm:inline">Registros:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-slate-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {pageSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Primera página"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 py-1 text-sm font-medium text-slate-700">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Última página"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
