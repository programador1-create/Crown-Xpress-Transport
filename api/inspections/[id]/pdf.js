import sql from '../../_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const id = req.query.id || req.url.split('/')[3]
      
      const [inspection] = await sql`
        SELECT pdf_filename, pdf_base64 
        FROM inspections 
        WHERE id = ${parseInt(id)}
      `

      if (!inspection) {
        return res.status(404).json({ error: 'Inspection not found' })
      }

      if (!inspection.pdf_base64) {
        return res.status(404).json({ error: 'PDF not found' })
      }

      // Convert base64 back to binary
      const pdfBuffer = Buffer.from(inspection.pdf_base64, 'base64')
      
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${inspection.pdf_filename}"`)
      return res.send(pdfBuffer)
    } catch (error) {
      console.error('PDF Download Error:', error)
      return res.status(500).json({ error: 'Failed to download PDF' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
