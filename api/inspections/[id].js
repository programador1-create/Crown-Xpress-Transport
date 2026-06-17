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
        trailer_number: "TRL" + id.padStart(3, '0'),
        container_number: null,
        seal_number: "S" + id.padStart(6, '0'),
        lock_number: null,
        driver_name: "Driver " + id,
        odometer: "12345",
        location: "Yard A - Laredo",
        inspection_date: new Date().toISOString(),
        high_security_seal: "yes",
        seal_affixed: "yes",
        guard_name: "GUARD " + id,
        guard_signature: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAmASwDASIAAhEBAxEB/8QAGAABAQEBAQAAAAAAAAAAAAAAAAECAwb/xAAnEAEBAAEDAwIGAwAAAAAAAAAAARECEjEhUZEDYRMiQXGBoTJCUv/EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFhEBAQEAAAAAAAAAAAAAAAAAACER/9oADAMBAAIRAxEAPwDxgAAAAAAAAAAAALJbwCDWy+3mJdFnbzA1BdtvEq7Nf+dXgGQss5AAAAAAABZpt6yWm3vZPyCC4nf9GJjkEAAAAAAAAAAAAAAAAAAAAa1S6v49ZPp2ZzjhZq1TjVfIiDpPW9Sf2z91+Nbzb5WFch03ab9cX3mWLcXpfzgCarOLZ+Wvnxnbmd7C+p768dtzO7tPPUGttxuunTjvlNU0y9NWYzbbc25AX5fe/ozp+mnzUEVd3aTwbtU4uPt0QAtt5uQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//Z",
        guard_signed_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        auditor_name: null,
        auditor_signature: null,
        auditor_signed_at: null,
        seal_photo: null,
        pdf_data: null,
        pdf_filename: `Inspeccion_TRL${id.padStart(3, '0')}_${new Date().toISOString().split('T')[0].replace(/-/g, '-')}.pdf`,
        language: "es",
        good_count: 15 + Math.floor(Math.random() * 5),
        bad_count: Math.floor(Math.random() * 3),
        pending_count: Math.floor(Math.random() * 5),
        status: "completed",
        original_inspection_id: null,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random day in last week
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
          details: null, 
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
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 150
>>
stream
BT
/F1 16 Tf
72 720 Td
(INSPECCIÓN DE SEGURIDAD) Tj
/F1 12 Tf
72 680 Td
(ID: ${id}) Tj
72 660 Td
(Trailer: TRL${id.padStart(3, '0')}) Tj
72 640 Td
(Guardia: GUARD ${id}) Tj
72 620 Td
(Fecha: ${new Date().toLocaleDateString()}) Tj
72 600 Td
(Estado: Completado) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000225 00000 n 
0000000375 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
450
%%EOF`
        
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
