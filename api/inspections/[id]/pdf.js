import { getSql } from '../../_lib/db.js'
import { generateInspectionPDF } from '../../../src/utils/pdfGenerator.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      const sql = getSql()
      const id = req.query.id || req.url.split('/')[3]
      
      const [inspection] = await sql`
        SELECT pdf_filename, pdf_data, language, location, inspection_type
        FROM inspections 
        WHERE id = ${parseInt(id)}
      `

      if (!inspection) {
        return res.status(404).json({ error: 'Inspection not found' })
      }

      let pdfBuffer = inspection.pdf_data

      // Regenerate PDF if missing (old inspections)
      if (!pdfBuffer) {
        console.log(`Regenerating PDF for inspection ${id}...`)
        
        // Get inspection details
        const [insp] = await sql`
          SELECT * FROM inspections WHERE id = ${parseInt(id)}
        `
        
        // Get points
        const pointsRows = await sql`
          SELECT point_id, status, issue_id, issue_text, photo
          FROM inspection_points
          WHERE inspection_id = ${parseInt(id)}
          ORDER BY point_id
        `
        
        // Convert points to object format
        const points = {}
        for (const p of pointsRows) {
          points[p.point_id] = {
            status: p.status,
            issueId: p.issue_id,
            issueText: p.issue_text,
            photo: p.photo
          }
        }
        
        // Build unitInfo
        const unitInfo = {
          trailerNumber: insp.trailer_number,
          tractorNumber: insp.tractor_number,
          containerNumber: insp.container_number,
          sealNumber: insp.seal_number,
          lockNumber: insp.lock_number,
          driverName: insp.driver_name,
          odometer: insp.odometer,
          location: insp.location,
          inspectionDate: insp.inspection_date,
          highSecuritySeal: insp.high_security_seal === 'yes' ? 'yes' : 'no',
          sealAffixed: insp.seal_affixed === 'yes' ? 'yes' : 'no',
          inspectionType: insp.inspection_type || 'LOADED',
          workOrder: insp.wono,
          trailerType: insp.trailer_type
        }
        
        // Generate PDF
        const { doc, filename } = await generateInspectionPDF({
          unitInfo,
          points,
          sealPhoto: insp.seal_photo,
          guardSignature: insp.guard_name ? { name: insp.guard_name, signedAt: insp.guard_signed_at } : null,
          supervisorSignature: insp.supervisor_signature ? { name: insp.supervisor_signature, signedAt: insp.supervisor_signed_at } : null,
          operatorSignature: insp.operator_name ? { name: insp.operator_name } : null,
          language: insp.language || 'es',
          yardCode: insp.location || ''
        })
        
        pdfBuffer = Buffer.from(doc.output('arraybuffer'))
        
        // Save to DB for future requests
        const pdfFilename = filename || `inspection-${id}.pdf`
        await sql`
          UPDATE inspections
          SET pdf_data = ${pdfBuffer}, pdf_filename = ${pdfFilename}
          WHERE id = ${parseInt(id)}
        `
        
        console.log(`PDF regenerated and saved for inspection ${id}`)
      }
      
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${inspection.pdf_filename || `inspection-${id}.pdf`}"`)
      return res.send(pdfBuffer)
    } catch (error) {
      console.error('PDF Download Error:', error)
      return res.status(500).json({ error: 'Failed to download PDF' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
