/** Simple API client for Crown Xpress Inspection */
import { getApplicablePoints } from '../data/inspectionPoints'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

/** Get supervisors by yard code */
export async function getSupervisorsByYard(yardCode) {
  const res = await fetchJson(`${API_BASE}/employees?role=supervisor`)
  const supervisors = res.data || []
  // Filter supervisors assigned to this yard
  return supervisors.filter(s => 
    s.yard_assignments?.some(ya => ya.yard_code === yardCode)
  )
}

/** Helper to handle fetch errors */
async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  
  // Clone response before reading body (in case we need to read it twice)
  const text = await res.text()
  
  if (!res.ok) {
    let err = {}
    try { err = JSON.parse(text) } catch {}
    throw new Error(err.error || err.message || `HTTP ${res.status}`)
  }
  
  // Parse JSON from text
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** Upload inspection + PDF to backend */
export async function createInspection(payload) {
  const res = await fetchJson(`${API_BASE}/inspections`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res // { success, id, uuid, createdAt, pdfUrl }
}

/** List inspections (paginated) */
export async function listInspections({ limit = 50, offset = 0, yardCode = '' } = {}) {
  const params = { limit, offset }
  if (yardCode) params.yardCode = yardCode
  const qs = new URLSearchParams(params)
  const res = await fetchJson(`${API_BASE}/inspections?${qs}`)
  return res // { data, limit, offset }
}

/** Get inspection details + points + audit */
export async function getInspection(id) {
  const res = await fetchJson(`${API_BASE}/inspections/${id}`)
  return res // { inspection, points, audits }
}

/** Download PDF binary */
export async function downloadPdf(id) {
  const res = await fetch(`${API_BASE}/inspections/${id}?pdf=true`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to download PDF: ${res.status} ${text}`)
  }
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/pdf')) {
    throw new Error(`Unexpected content type: ${contentType}`)
  }
  const blob = await res.blob()
  if (!blob || blob.size === 0) {
    throw new Error('PDF empty')
  }
  return blob
}

/** Add supervisor signature later (optional) */
export async function signSupervisor(id, { name, signature, signedAt, pdfBase64, pdfFilename }) {
  const body = { name, signature, signedAt }
  if (pdfBase64) {
    body.pdfBase64 = pdfBase64
    body.pdfFilename = pdfFilename
  }
  const res = await fetchJson(`${API_BASE}/inspections/${id}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res // { success, id, supervisor_name, supervisor_signed_at, status }
}

/** Health check */
export async function healthCheck() {
  return await fetchJson(`${API_BASE}/health`)
}

/** Get TPR movements (empty loads) */
export async function getTprMovements({ type = 'empty', date = null, yardCode = null } = {}) {
  const params = new URLSearchParams({ type })
  if (date) params.append('date', date)
  if (yardCode) params.append('yardCode', yardCode)
  const res = await fetchJson(`${API_BASE}/tpr?${params}`)
  return res // { success, data, count }
}

/** Search operator by employee number */
export async function searchOperator(employeeNumber) {
  const res = await fetchJson(`${API_BASE}/employees?employee_number=${encodeURIComponent(employeeNumber)}`)
  return res // { success, operator: { id, employeeNumber, fullName, ... } }
}

/** Search operators by name */
export async function searchOperatorsByName(name) {
  const res = await fetchJson(`${API_BASE}/employees?search_name=${encodeURIComponent(name)}`)
  return res // { success, operators: [...] }
}

/** List all active operators */
export async function listOperators() {
  const res = await fetchJson(`${API_BASE}/employees?list_operators=true`)
  return res // { success, operators: [...] }
}

/** Reconfirm an inspection (create new linked record) */
export async function reconfirmInspection(originalId, payload) {
  const res = await fetchJson(`${API_BASE}/inspections/${originalId}/reconfirm`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res
}

/** Get inspection chain (original + reconfirmations) */
export async function getInspectionChain(id) {
  const res = await fetchJson(`${API_BASE}/inspections/${id}/chain`)
  return res
}

/**
 * Compress a base64 image to reduce payload size
 * @param {string} base64Image - Base64 encoded image (with or without data URI prefix)
 * @param {number} maxWidth - Maximum width in pixels (default 800)
 * @param {number} quality - JPEG quality 0-1 (default 0.6)
 * @returns {Promise<string>} - Compressed base64 image
 */
export async function compressImage(base64Image, maxWidth = 800, quality = 0.6, format = 'image/jpeg') {
  if (!base64Image) return null
  
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width
      let height = img.height
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      
      // Convert to compressed format (JPEG or PNG)
      const compressed = canvas.toDataURL(format, quality)
      resolve(compressed)
    }
    img.onerror = () => {
      // If compression fails, return original
      resolve(base64Image)
    }
    img.src = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`
  })
}

/** Build payload for createInspection (with aggressive image compression) */
export async function buildPayload(ctx, pdfBase64, pdfFilename) {
  const { unitInfo, points, sealPhoto, guardSignature, supervisorSignature, operatorSignature, completedCount, failedCount, goodCount } = ctx
  const supervisorSig = supervisorSignature || { name: '', signature: null, signedAt: null }
  
  // Compress seal photo more aggressively (400px, 40% quality)
  const compressedSealPhoto = sealPhoto ? await compressImage(sealPhoto, 400, 0.4) : null
  
  // Map points to API shape with compressed photos (400px, 40% quality)
  const pointsPayload = {}
  for (const [id, p] of Object.entries(points)) {
    const compressedPhoto = p.photo ? await compressImage(p.photo, 400, 0.4) : null
    pointsPayload[id] = {
      status: p.status || 'pending',
      issueId: p.issueId || null,
      issueText: null,
      photo: compressedPhoto,
    }
  }

  // Compress signatures (600px, 95% quality for guard/supervisor, 80% for operator)
  // Keep as PNG to preserve transparency, don't convert to JPEG
  const compressedGuardSig = guardSignature?.signature
    ? await compressImage(guardSignature.signature, 600, 0.95, 'image/png')
    : null
  const compressedSupervisorSig = supervisorSig?.signature
    ? await compressImage(supervisorSig.signature, 600, 0.95, 'image/png')
    : null
  const compressedOperatorSig = operatorSignature?.signature
    ? await compressImage(operatorSignature.signature, 600, 0.8, 'image/png')
    : null

  // Send the full PDF to backend for storage
  return {
    unitInfo,
    points: pointsPayload,
    guardSignature: { ...guardSignature, signature: compressedGuardSig },
    supervisorSignature: { ...supervisorSig, signature: compressedSupervisorSig },
    operatorSignature: { ...operatorSignature, signature: compressedOperatorSig },
    sealPhoto: compressedSealPhoto,
    language: 'es',
    pdfBase64,
    pdfFilename,
    counts: {
      good: goodCount || 0,
      bad: failedCount || 0,
      pending: Math.max(0, getApplicablePoints(unitInfo?.inspectionType).length - (completedCount || 0))
    },
  }
}
