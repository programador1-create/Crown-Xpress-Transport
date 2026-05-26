// Crown Xpress Transport Logo as SVG data URL for PDF generation
// This is the official Crown logo with the crown symbol

export const CROWN_LOGO_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cGF0aCBkPSJNMTUgNzAgTDI1IDM1IEw0MCA1NSBMNTAgMjUgTDYwIDU1IEw3NSAzNSBMODUgNzAgWiIgZmlsbD0iI2M5YTk2MSIgc3Ryb2tlPSIjYTY4OTQxIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8Y2lyY2xlIGN4PSIyNSIgY3k9IjMyIiByPSIzIiBmaWxsPSIjYzlhOTYxIi8+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSIyMiIgcj0iMyIgZmlsbD0iI2M5YTk2MSIvPgogIDxjaXJjbGUgY3g9Ijc1IiBjeT0iMzIiIHI9IjMiIGZpbGw9IiNjOWE5NjEiLz4KICA8cmVjdCB4PSIxNSIgeT0iNzAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI2IiBmaWxsPSIjMWU1YjdhIi8+Cjwvc3ZnPg==`

// Alternative: Draw crown programmatically in PDF
export function drawCrownLogo(doc, x, y, size = 20) {
  const scale = size / 20
  const cx = x + size / 2
  const cy = y + size / 2
  
  // Gold color for crown
  doc.setFillColor(201, 169, 97)
  doc.setDrawColor(166, 137, 65)
  doc.setLineWidth(0.3 * scale)
  
  // Crown shape - 5 points
  const crownPoints = [
    [x + 3 * scale, y + 14 * scale],      // bottom left
    [x + 5 * scale, y + 7 * scale],       // left peak
    [x + 8 * scale, y + 11 * scale],      // left valley
    [x + 10 * scale, y + 5 * scale],      // center peak (highest)
    [x + 12 * scale, y + 11 * scale],     // right valley
    [x + 15 * scale, y + 7 * scale],      // right peak
    [x + 17 * scale, y + 14 * scale],     // bottom right
  ]
  
  // Draw crown body
  doc.setFillColor(201, 169, 97)
  
  // Use lines to create crown shape
  doc.moveTo(crownPoints[0][0], crownPoints[0][1])
  for (let i = 1; i < crownPoints.length; i++) {
    doc.lineTo(crownPoints[i][0], crownPoints[i][1])
  }
  doc.lineTo(crownPoints[0][0], crownPoints[0][1])
  doc.fill()
  
  // Draw circles on peaks
  const peakRadius = 0.6 * scale
  doc.setFillColor(201, 169, 97)
  doc.circle(x + 5 * scale, y + 6.4 * scale, peakRadius, 'F')
  doc.circle(x + 10 * scale, y + 4.4 * scale, peakRadius, 'F')
  doc.circle(x + 15 * scale, y + 6.4 * scale, peakRadius, 'F')
  
  // Navy base bar
  doc.setFillColor(30, 91, 122)
  doc.rect(x + 3 * scale, y + 14 * scale, 14 * scale, 1.2 * scale, 'F')
}

// Simple triangle version (current implementation backup)
export function drawSimpleCrown(doc, x, y, size = 12) {
  doc.setFillColor(201, 169, 97)
  doc.triangle(x, y + size, x + size / 2, y, x + size, y + size, 'F')
}
