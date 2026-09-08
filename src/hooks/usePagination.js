import { useState, useEffect, useMemo } from 'react'

/**
 * Hook reutilizable para paginación de listas.
 * Soporta page sizes de 15/25/50 y persistencia en localStorage.
 *
 * @param {Array} items - Array completo de elementos a paginar
 * @param {string} storageKey - Key para guardar el pageSize en localStorage
 * @returns {object} { page, pageSize, pageItems, totalPages, setPage, setPageSize, pageSizes }
 */
export function usePagination(items, storageKey = 'pageSize') {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    const valid = [15, 25, 50]
    return valid.includes(Number(saved)) ? Number(saved) : 15
  })

  // Reset to page 1 when pageSize changes or when items shrink
  useEffect(() => {
    setPage(1)
  }, [pageSize])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, safePage, pageSize])

  const setPageSize = (size) => {
    setPageSizeState(size)
    localStorage.setItem(storageKey, String(size))
  }

  return {
    page: safePage,
    pageSize,
    pageItems,
    totalPages,
    setPage,
    setPageSize,
    pageSizes: [15, 25, 50],
  }
}
