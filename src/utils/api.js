/** Simple API client for Crown Xpress Inspection */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

/** Helper to handle fetch errors */
async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || err.message || `HTTP ${res.status}`)
  }
  if (res.headers.get('content-type')?.includes('application/json')) {
    return await res.json()
  }
  return res
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
export async function listInspections({ limit = 50, offset = 0 } = {}) {
  const qs = new URLSearchParams({ limit, offset })
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
  const res = await fetch(`${API_BASE}/inspections/${id}/pdf`)
  if (!res.ok) throw new Error('Failed to download PDF')
  const blob = await res.blob()
  return blob
}

/** Add auditor signature later (optional) */
export async function signAuditor(id, { name, signedAt }) {
  const res = await fetchJson(`${API_BASE}/inspections/${id}/sign-auditor`, {
    method: 'POST',
    body: JSON.stringify({ name, signedAt }),
  })
  return res // { success, id, auditor_name, auditor_signed_at, status }
}

/** Health check */
export async function healthCheck() {
  return await fetchJson(`${API_BASE}/health`)
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

/** Build payload for createInspection */
export function buildPayload(ctx, pdfBase64, pdfFilename) {
  const { unitInfo, points, sealPhoto, guardSignature, auditorSignature, completedCount, failedCount, goodCount } = ctx
  // Map points to API shape
  const pointsPayload = {}
  for (const [id, p] of Object.entries(points)) {
    pointsPayload[id] = {
      status: p.status || 'pending',
      issueId: p.issueId || null,
      issueText: null,
      photo: p.photo || null,
    }
  }
  return {
    unitInfo,
    points: pointsPayload,
    guardSignature,
    auditorSignature,
    sealPhoto,
    language: 'es',
    pdfBase64,
    pdfFilename,
    counts: { 
      good: goodCount || 0, 
      bad: failedCount || 0, 
      pending: 20 - (completedCount || 0) 
    },
  }
}
