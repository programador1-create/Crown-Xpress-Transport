import { put, head, del } from '@vercel/blob'

/**
 * Helper para guardar y leer PDFs de inspección en Vercel Blob Storage
 * en lugar de guardarlos como BYTEA dentro de Neon (que tiene límite de 512 MB).
 *
 * Requiere la variable de entorno BLOB_READ_WRITE_TOKEN configurada en Vercel.
 */

/**
 * Sube un PDF a Vercel Blob y retorna la URL pública.
 * @param {Buffer} pdfBuffer - Buffer del PDF
 * @param {string} filename - Nombre del archivo (ej: "inspection-123.pdf")
 * @param {object} opts - Opciones adicionales
 * @returns {Promise<{url: string, size: number, filename: string}>}
 */
export async function uploadPdf(pdfBuffer, filename, opts = {}) {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('PDF buffer is empty')
  }

  const pathname = `inspections/${filename || 'inspection.pdf'}`

  const blob = await put(pathname, pdfBuffer, {
    access: 'public',
    contentType: 'application/pdf',
    addRandomSuffix: true,
    ...opts,
  })

  return {
    url: blob.url,
    size: pdfBuffer.length,
    filename: filename || 'inspection.pdf',
  }
}

/**
 * Obtiene la URL del PDF almacenado en Blob.
 * Si la inspección tiene pdf_url, la retorna directamente.
 * @param {string} pdfUrl - URL almacenada en la columna pdf_url
 * @returns {string|null}
 */
export function getPdfUrl(pdfUrl) {
  if (!pdfUrl) return null
  return pdfUrl
}

/**
 * Descarga el contenido binario de un PDF desde Blob.
 * @param {string} pdfUrl - URL del blob
 * @returns {Promise<Buffer>}
 */
export async function downloadPdfBuffer(pdfUrl) {
  if (!pdfUrl) return null

  const response = await fetch(pdfUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF from Blob: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Elimina un PDF de Blob Storage.
 * @param {string} pdfUrl - URL del blob a eliminar
 */
export async function deletePdf(pdfUrl) {
  if (!pdfUrl) return
  try {
    await del(pdfUrl)
  } catch (err) {
    console.error('deletePdf error (non-fatal):', err.message)
  }
}

/**
 * Verifica si el token de Blob está configurado.
 * Útil para diagnósticos.
 */
export function isBlobConfigured() {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}
