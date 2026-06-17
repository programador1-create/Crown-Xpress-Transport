// import sql from '../_lib/db.js'
// import { generatePDF } from '../_lib/pdf-generator.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query
  console.log('Endpoint called:', req.method, req.url, 'ID:', id)

  try {
    if (req.method === 'GET') {
      console.log('Processing GET request for inspection:', id)
      
      // Mock data for testing
      const mockInspection = {
        id: parseInt(id),
        uuid: "test-uuid-" + id,
        trailer_number: "TEST" + id,
        container_number: null,
        seal_number: null,
        lock_number: null,
        driver_name: "Test Driver",
        odometer: null,
        location: "Test Location",
        inspection_date: new Date().toISOString(),
        high_security_seal: "yes",
        seal_affixed: "yes",
        guard_name: "Test Guard",
        guard_signature: null,
        guard_signed_at: null,
        auditor_name: null,
        auditor_signature: null,
        auditor_signed_at: null,
        seal_photo: null,
        pdf_data: null,
        pdf_filename: `test_${id}.pdf`,
        language: "es",
        good_count: 10,
        bad_count: 0,
        pending_count: 0,
        status: "completed",
        original_inspection_id: null,
        created_at: new Date().toISOString(),
        supervisor_signature: null,
        supervisor_signed_at: null
      }

      const mockPoints = []
      for (let i = 1; i <= 20; i++) {
        mockPoints.push({
          id: i,
          inspection_id: parseInt(id),
          point_id: i,
          status: "good",
          issue_id: null,
          issue_text: null,
          photo: null,
          created_at: new Date().toISOString()
        })
      }

      const mockAudits = [
        { 
          id: 1, 
          inspection_id: parseInt(id), 
          action: "created", 
          actor_name: "Test User", 
          details: { counts: { bad: 0, good: 10, pending: 0 } }, 
          created_at: new Date().toISOString() 
        }
      ]

      return res.status(200).json({
        inspection: mockInspection,
        points: mockPoints,
        audits: mockAudits
      })
    }

    // Handle PDF generation (GET request)
    if (req.method === 'GET' && req.url.includes('pdf')) {
      try {
        console.log('Generating PDF for inspection:', id)
        // Simple PDF response
        const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n/Resources <<\n/Font <<\n/F1 5 0 R\n>>\n>>\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Inspection PDF) Tj\nET\nendstream\nendobj\n5 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000054 00000 n \n0000000123 00000 n \n0000000225 00000 n \n0000000320 00000 n \ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n406\n%%EOF'
        
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="inspection-${id}.pdf"`)
        return res.status(200).send(Buffer.from(pdfContent))
      } catch (error) {
        console.error('PDF generation error:', error)
        return res.status(500).json({ 
          error: 'Failed to generate PDF',
          details: error.message 
        })
      }
    }

    if (req.method === 'POST') {
      console.log('POST request received:', req.url)
      // Check if this is a supervisor signature request
      const isSupervisorSignature = req.url.includes('sign-supervisor')
      console.log('Is supervisor signature request:', isSupervisorSignature)
      
      if (isSupervisorSignature) {
        console.log('Processing supervisor signature for inspection:', id)
        console.log('Request body:', req.body)
        const { name, signedAt } = req.body
        
        if (!name || !signedAt) {
          return res.status(400).json({ error: 'Name and signedAt are required' })
        }

        try {
          // Mock supervisor signature update (no database)
          console.log('Supervisor signature updated successfully for inspection:', id)
          return res.status(200).json({ 
            message: 'Supervisor signature added successfully',
            inspection: {
              id: parseInt(id),
              supervisor_signature: name,
              supervisor_signed_at: signedAt,
              updated_at: new Date().toISOString()
            }
          })
        } catch (error) {
          console.error('Error in supervisor signature:', error)
          return res.status(500).json({ 
            error: 'Failed to process supervisor signature',
            details: error.message 
          })
        }
      }
      
      // Handle other POST requests if needed
      return res.status(405).json({ error: 'Method not allowed' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
