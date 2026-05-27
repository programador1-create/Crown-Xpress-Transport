import sql from '../../db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query

  try {
    if (req.method === 'GET') {
      const isUuid = id.includes('-')
      
      const inspections = isUuid
        ? await sql`SELECT pdf_data, pdf_filename FROM inspections WHERE uuid = ${id}`
        : await sql`SELECT pdf_data, pdf_filename FROM inspections WHERE id = ${parseInt(id)}`

      if (inspections.length === 0 || !inspections[0].pdf_data) {
        return res.status(404).json({ error: 'PDF not found' })
      }

      const { pdf_data, pdf_filename } = inspections[0]
      
      // Remove data URI prefix if present and convert to buffer
      let base64Data = pdf_data
      if (typeof pdf_data === 'string' && pdf_data.includes(',')) {
        base64Data = pdf_data.split(',')[1]
      } else if (typeof pdf_data === 'string' && pdf_data.startsWith('data:')) {
        base64Data = pdf_data.replace(/^data:application\/pdf;base64,/, '')
      }
      
      const pdfBuffer = Buffer.from(base64Data, 'base64')

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${pdf_filename || 'inspection.pdf'}"`)
      res.setHeader('Content-Length', pdfBuffer.length)

      return res.send(pdfBuffer)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('PDF API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
