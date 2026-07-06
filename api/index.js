// Vercel serverless entry point (exported as default)
import { createInspection, listInspections, getInspection, downloadPdf, signAuditor, healthCheck, reconfirmInspection, getInspectionChain, updateInspectionPdf } from './_lib/handlers.js'

export default async function handler(req, res) {
  const { url, method } = req
  const path = new URL(url, 'http://x').pathname

  // Simple router
  if (path === '/api/health' && method === 'GET') {
    return await healthCheck(req, res)
  }
  if (path === '/api/inspections' && method === 'POST') {
    return await createInspection(req, res)
  }
  if (path === '/api/inspections' && method === 'GET') {
    return await listInspections(req, res)
  }

  // Dynamic routes
  const match = path.match(/^\/api\/inspections\/(\d+)(\/pdf|\/sign-auditor|\/reconfirm|\/chain)?$/)
  if (match) {
    const id = match[1]
    const suffix = match[2]
    if (!suffix && method === 'GET') {
      return await getInspection(req, res, id)
    }
    if (suffix === '/pdf' && method === 'GET') {
      return await downloadPdf(req, res, id)
    }
    if (suffix === '/pdf' && method === 'PUT') {
      return await updateInspectionPdf(req, res, id)
    }
    if (suffix === '/sign-auditor' && method === 'POST') {
      return await signAuditor(req, res, id)
    }
    if (suffix === '/reconfirm' && method === 'POST') {
      return await reconfirmInspection(req, res, id)
    }
    if (suffix === '/chain' && method === 'GET') {
      return await getInspectionChain(req, res, id)
    }
  }

  // Not found
  res.setHeader('Allow', 'GET,POST')
  return res.status(404).json({ error: 'Not found' })
}
