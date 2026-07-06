import { getSql } from '../../_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const sql = getSql()
      const id = req.query.id || (req.params && req.params.id)

      if (!id) {
        return res.status(400).json({ error: 'Inspection ID is required' })
      }

      const [inspection] = await sql`
        SELECT pdf_filename, pdf_data
        FROM inspections
        WHERE id = ${parseInt(id)}
      `

      if (!inspection) {
        return res.status(404).json({ error: 'Inspection not found' })
      }

      if (!inspection.pdf_data) {
        return res.status(404).json({ error: 'PDF not available in database - frontend will generate it' })
      }

      // pdf_data is already BYTEA (binary)
      const pdfBuffer = inspection.pdf_data

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${inspection.pdf_filename || `inspection-${id}.pdf`}"`)
      return res.send(pdfBuffer)
    } catch (error) {
      console.error('PDF Download Error:', error)
      return res.status(500).json({ error: 'Failed to download PDF' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const sql = getSql()
      const id = req.query.id || (req.params && req.params.id)

      if (!id) {
        return res.status(400).json({ error: 'Inspection ID is required' })
      }

      const body = req.body || await new Promise((resolve) => {
        let data = ''
        req.on('data', chunk => { data += chunk })
        req.on('end', () => { try { resolve(JSON.parse(data)) } catch { resolve({}) } })
      })

      const { pdfBase64, pdfFilename } = body
      if (!pdfBase64) {
        return res.status(400).json({ error: 'pdfBase64 required' })
      }

      const pdfDataB64 = String(pdfBase64).replace(/^data:application\/pdf(;[^,]*)?;base64,/, '')
      const pdfBuffer = Buffer.from(pdfDataB64, 'base64')

      console.log('PUT /api/inspections/[id]/pdf - size:', pdfBuffer.length, 'bytes')

      const [updated] = await sql`
        UPDATE inspections
        SET pdf_filename = ${pdfFilename || 'inspection.pdf'},
            pdf_data = ${pdfBuffer},
            pdf_size_bytes = ${pdfBuffer.length},
            updated_at = NOW()
        WHERE id = ${parseInt(id)}
        RETURNING id
      `

      if (!updated) {
        return res.status(404).json({ error: 'Inspection not found' })
      }

      return res.status(200).json({ success: true, pdfSize: pdfBuffer.length })
    } catch (error) {
      console.error('PDF Upload Error:', error)
      return res.status(500).json({ error: 'Failed to upload PDF' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
