// Local dev server (Express) – mirrors Vercel serverless API
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createInspection, listInspections, downloadPdf, signAuditor, healthCheck, reconfirmInspection, getInspectionChain } from './api/_lib/handlers.js'
import authHandler from './api/auth.js'
import employeesHandler from './api/employees.js'
import yardManagementHandler from './api/yard-management.js'
import tprHandler from './api/tpr.js'
import tprV2Handler from './api/tpr-v2.js'
import verifyImageHandler from './api/verify-image.js'
import inspectionIdHandler from './api/inspections/[id].js'

dotenv.config()
const app = express()
const PORT = process.env.API_PORT || 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Helper to adapt Express req/res to Vercel style
function adaptHandler(handler) {
  return async (req, res) => {
    // Add url property (Vercel expects this)
    req.url = `${req.path}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`
    await handler(req, res)
  }
}

// Routes (same as Vercel)
app.get('/api/health', adaptHandler(healthCheck))
app.post('/api/auth', adaptHandler(authHandler))
app.get('/api/employees', adaptHandler(employeesHandler))
app.put('/api/employees', adaptHandler(employeesHandler))
app.delete('/api/employees', adaptHandler(employeesHandler))
app.get('/api/yard-management', adaptHandler(yardManagementHandler))
app.post('/api/yard-management', adaptHandler(yardManagementHandler))
app.delete('/api/yard-management', adaptHandler(yardManagementHandler))
app.get('/api/tpr', adaptHandler(tprHandler))
app.get('/api/tpr-v2', adaptHandler(tprV2Handler))
app.post('/api/verify-image', adaptHandler(verifyImageHandler))
app.post('/api/inspections', adaptHandler(createInspection))
app.get('/api/inspections', adaptHandler(listInspections))
app.all('/api/inspections/:id', adaptHandler(inspectionIdHandler))
app.get('/api/inspections/:id/pdf', adaptHandler((req, res, id) => downloadPdf(req, res, id)))
app.post('/api/inspections/:id/sign-auditor', adaptHandler((req, res, id) => signAuditor(req, res, id)))
app.post('/api/inspections/:id/reconfirm', adaptHandler((req, res, id) => reconfirmInspection(req, res, id)))
app.get('/api/inspections/:id/chain', adaptHandler((req, res) => getInspectionChain(req, res, req.params.id)))

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 API server listening on http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/api/health`)
})
