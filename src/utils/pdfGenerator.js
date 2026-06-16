import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { inspectionPoints, getIssuesForPoint, INSPECTION_TYPES } from '../data/inspectionPoints'

// Crown Xpress logo will be loaded from public folder
const CROWN_LOGO_URL = '/crown-logo.png'
const CTPAT_LOGO_URL = '/ctpat-logo.png'

// Truck diagram images - different images for each inspection type
import truckDiagramLoaded from '../assets/Gemini_Generated_Image_nwvt4xnwvt4xnwvt.jpg'
import truckDiagramEmpty from '../assets/Vacio-Contenedor-Caja.jpg'
import truckDiagramDropped from '../assets/Botado-Caja-Contenedor.jpg'

const COLORS = {
  navy: [30, 91, 122],
  navyDark: [13, 59, 84],
  gold: [201, 169, 97],
  goldDark: [166, 137, 65],
  emerald: [5, 150, 105],
  rose: [225, 29, 72],
  slate: [71, 85, 105],
  slateLight: [148, 163, 184],
}

// Load logo image as base64
async function loadLogoImage() {
  try {
    const response = await fetch(CROWN_LOGO_URL)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.warn('Could not load logo:', e)
    return null
  }
}

// Load C-TPAT logo image as base64
async function loadCtpatLogoImage() {
  try {
    const response = await fetch(CTPAT_LOGO_URL)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.warn('Could not load C-TPAT logo:', e)
    return null
  }
}

// Load truck diagram image as base64 based on inspection type
async function loadTruckDiagramImage(inspectionType) {
  try {
    // Select the appropriate image based on inspection type
    let truckDiagramImage
    switch (inspectionType) {
      case 'EMPTY':
        truckDiagramImage = truckDiagramEmpty
        break
      case 'DROPPED':
        truckDiagramImage = truckDiagramDropped
        break
      case 'LOADED':
      default:
        truckDiagramImage = truckDiagramLoaded
        break
    }
    
    const response = await fetch(truckDiagramImage)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.warn('Could not load truck diagram:', e)
    return null
  }
}

export async function generateInspectionPDF({ unitInfo, points, sealPhoto, guardSignature, auditorSignature, operatorSignature, language = 'es' }) {
  // Pre-load images (pass inspection type to get correct diagram)
  const logoBase64 = await loadLogoImage()
  const ctpatLogoBase64 = await loadCtpatLogoImage()
  const truckDiagramBase64 = await loadTruckDiagramImage(unitInfo?.inspectionType)
  
  const T = language === 'es' ? {
    title: 'INSPECCIÓN DE 20 PUNTOS',
    subtitle: 'Crown Xpress Transport · Logistics',
    formCode: 'CSC-FINS20P-01',
    unitInfo: 'INFORMACIÓN DE LA UNIDAD',
    trailerNumber: 'No. Trailer / Contenedor',
    sealNumber: 'No. Sello',
    driverName: 'Operador',
    odometer: 'Odómetro',
    location: 'Ubicación',
    date: 'Fecha y Hora',
    highSecuritySeal: 'Sello Alta Seguridad',
    sealAffixed: 'Sello Verificado',
    yes: 'Sí',
    no: 'No',
    inspectionTitle: 'REVISIÓN DE 20 PUNTOS',
    pointHeader: '#',
    descHeader: 'Punto de Inspección',
    statusHeader: 'Estado',
    issueHeader: 'Falla Reportada',
    good: 'BUENO',
    bad: 'MALO',
    pending: '—',
    failuresTitle: 'DETALLE DE FALLAS',
    sealPhoto: 'FOTO DEL SELLO',
    signatures: 'FIRMAS',
    guardSig: 'GUARDIA',
    auditorSig: 'AUDITOR',
    operatorSig: 'OPERADOR',
    signedAt: 'Firmado',
    notSigned: 'No firmado',
    summary: 'RESUMEN',
    totalGood: 'Bueno',
    totalBad: 'Malo',
    totalPending: 'Pendiente',
    failurePhoto: 'Foto',
    page: 'Página',
    of: 'de',
    generated: 'Generado'
  } : {
    title: '20 POINT INSPECTION',
    subtitle: 'Crown Xpress Transport · Logistics',
    formCode: 'CSC-FINS20P-01',
    unitInfo: 'UNIT INFORMATION',
    trailerNumber: 'Trailer / Container No.',
    sealNumber: 'Seal No.',
    driverName: 'Driver',
    odometer: 'Odometer',
    location: 'Location',
    date: 'Date & Time',
    highSecuritySeal: 'High Security Seal',
    sealAffixed: 'Seal Verified',
    yes: 'Yes',
    no: 'No',
    inspectionTitle: '20-POINT INSPECTION REVIEW',
    pointHeader: '#',
    descHeader: 'Inspection Point',
    statusHeader: 'Status',
    issueHeader: 'Reported Issue',
    good: 'GOOD',
    bad: 'BAD',
    pending: '—',
    failuresTitle: 'FAILURE DETAILS',
    sealPhoto: 'SEAL PHOTO',
    signatures: 'SIGNATURES',
    guardSig: 'GUARD',
    auditorSig: 'AUDITOR',
    operatorSig: 'OPERATOR',
    signedAt: 'Signed',
    notSigned: 'Not signed',
    summary: 'SUMMARY',
    totalGood: 'Good',
    totalBad: 'Bad',
    totalPending: 'Pending',
    failurePhoto: 'Photo',
    page: 'Page',
    of: 'of',
    generated: 'Generated'
  }

  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14

  // Get applicable points based on inspection type
  const inspectionType = unitInfo?.inspectionType || 'LOADED'
  const typeConfig = INSPECTION_TYPES[inspectionType]
  const applicablePoints = typeConfig 
    ? inspectionPoints.filter(p => typeConfig.applicablePoints.includes(p.id))
    : inspectionPoints

  // ===== HEADER =====
  drawHeader(doc, T, pageWidth, margin, logoBase64, ctpatLogoBase64, inspectionType, language)

  let y = 38

  // ===== UNIT INFO =====
  doc.setFillColor(...COLORS.navy)
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(T.unitInfo, margin + 2, y + 4)
  y += 6

  // Build info rows - show lock number only for LOADED type
  const infoRows = []
  
  // Row 1: Trailer/Container and Seal/Lock based on inspection type
  if (inspectionType === 'LOADED') {
    // LOADED can have seal OR lock
    const lockLabel = language === 'es' ? 'No. Candado' : 'Lock No.'
    const sealOrLock = unitInfo.sealNumber || unitInfo.lockNumber || 'N/A'
    const sealOrLockLabel = unitInfo.sealNumber ? T.sealNumber : lockLabel
    infoRows.push([T.trailerNumber, unitInfo.trailerNumber || '—', sealOrLockLabel, sealOrLock])
  } else {
    // EMPTY and BOBTAIL don't use seal or lock
    infoRows.push([T.trailerNumber, unitInfo.trailerNumber || '—', '', ''])
  }
  
  // Row 2: Driver and Date
  infoRows.push([T.driverName, unitInfo.driverName || '—', T.date, formatDate(unitInfo.inspectionDate)])
  
  // Row 3: Location
  infoRows.push([T.location, unitInfo.location || '—', '', ''])
  
  // Row 4: Seal info only for LOADED
  if (inspectionType === 'LOADED') {
    infoRows.push([T.highSecuritySeal, unitInfo.highSecuritySeal === 'yes' ? T.yes : 'N/A', T.sealAffixed, unitInfo.sealAffixed === 'yes' ? T.yes : 'N/A'])
  }

  autoTable(doc, {
    startY: y,
    body: infoRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.8, lineColor: [200, 210, 220] },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: COLORS.navyDark, cellWidth: 38 },
      1: { textColor: [30, 41, 59] },
      2: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: COLORS.navyDark, cellWidth: 38 },
      3: { textColor: [30, 41, 59] },
    },
    margin: { left: margin, right: margin }
  })
  y = doc.lastAutoTable.finalY + 4

  // ===== SUMMARY BAR =====
  // Count only applicable points
  const goodCount = applicablePoints.filter(p => points[p.id]?.status === 'good').length
  const badCount = applicablePoints.filter(p => points[p.id]?.status === 'bad').length
  const pendingCount = applicablePoints.length - goodCount - badCount

  drawSummaryBar(doc, margin, y, pageWidth - margin * 2, T, goodCount, badCount, pendingCount)
  y += 12

  // ===== INSPECTION TABLE =====
  doc.setFillColor(...COLORS.navy)
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  const inspectionTitle = language === 'es' 
    ? `REVISIÓN DE ${applicablePoints.length} PUNTOS` 
    : `${applicablePoints.length}-POINT INSPECTION REVIEW`
  doc.text(inspectionTitle, margin + 2, y + 4)
  y += 6

  const tableBody = applicablePoints.map(p => {
    const state = points[p.id] || { status: null, issueId: null, issueCustomText: null }
    const statusText = state.status === 'good' ? T.good : state.status === 'bad' ? T.bad : T.pending
    const pointIssues = getIssuesForPoint(p.id)
    const issue = pointIssues.find(e => e.id === state.issueId)
    // If custom text exists (for "OTHER" option), show it instead of the issue name
    const issueText = state.issueCustomText 
      ? state.issueCustomText.toUpperCase() 
      : (issue ? issue[language].toUpperCase() : '')
    return [
      p.id.toString(),
      p[language].toUpperCase(),
      statusText,
      issueText
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [[T.pointHeader, T.descHeader, T.statusHeader, T.issueHeader]],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: [200, 210, 220], valign: 'middle' },
    headStyles: { fillColor: COLORS.navyDark, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 90 },
      2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const cellText = data.cell.text[0]
        if (cellText === T.good) {
          data.cell.styles.fillColor = [220, 252, 231]
          data.cell.styles.textColor = COLORS.emerald
        } else if (cellText === T.bad) {
          data.cell.styles.fillColor = [254, 226, 226]
          data.cell.styles.textColor = COLORS.rose
        }
      }
    },
    margin: { left: margin, right: margin }
  })
  y = doc.lastAutoTable.finalY + 5

  // ===== FAILURE PHOTOS =====
  const failures = inspectionPoints.filter(p => points[p.id]?.status === 'bad' && points[p.id]?.photo)
  if (failures.length > 0) {
    if (y > pageHeight - 60) {
      doc.addPage()
      drawHeader(doc, T, pageWidth, margin, logoBase64, ctpatLogoBase64, inspectionType, language)
      y = 38
    }

    doc.setFillColor(...COLORS.rose)
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(T.failuresTitle, margin + 2, y + 4)
    y += 8

    const photoW = 56, photoH = 42
    const cols = 3
    const gap = 4
    const totalW = cols * photoW + (cols - 1) * gap
    const startX = (pageWidth - totalW) / 2

    for (let i = 0; i < failures.length; i++) {
      const p = failures[i]
      const state = points[p.id]
      const pointIssues = getIssuesForPoint(p.id)
      const issue = pointIssues.find(e => e.id === state.issueId)
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (photoW + gap)
      const cellY = y + row * (photoH + 22)

      if (cellY + photoH + 22 > pageHeight - 25) {
        doc.addPage()
        drawHeader(doc, T, pageWidth, margin, logoBase64, ctpatLogoBase64, inspectionType, language)
        y = 38
        continue
      }

      // Frame
      doc.setDrawColor(...COLORS.rose)
      doc.setLineWidth(0.5)
      doc.rect(x, cellY, photoW, photoH)

      // Photo
      try {
        doc.addImage(state.photo, 'JPEG', x + 0.5, cellY + 0.5, photoW - 1, photoH - 1)
      } catch (e) { /* ignore */ }

      // Number badge
      doc.setFillColor(...COLORS.rose)
      doc.circle(x + 4, cellY + 4, 3.2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.text(p.id.toString(), x + 4, cellY + 5.2, { align: 'center' })

      // Caption
      doc.setTextColor(30, 41, 59)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      const title = doc.splitTextToSize(`${p.id}. ${p[language]}`, photoW)
      doc.text(title.slice(0, 1), x, cellY + photoH + 4)

      if (issue) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(...COLORS.rose)
        const issueLines = doc.splitTextToSize(issue[language], photoW)
        doc.text(issueLines.slice(0, 2), x, cellY + photoH + 8)
      }
    }
    y += Math.ceil(failures.length / cols) * (photoH + 22)
  }

  // ===== PAGE 2: TRUCK DIAGRAM (vertical page, horizontal image centered) =====
  doc.addPage()
  drawHeader(doc, T, pageWidth, margin, logoBase64, ctpatLogoBase64, inspectionType, language)
  
  let diagramY = 38
  
  // Title
  doc.setFillColor(...COLORS.navy)
  doc.rect(margin, diagramY, pageWidth - margin * 2, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(language === 'es' ? 'DIAGRAMA DE INSPECCIÓN' : 'INSPECTION DIAGRAM', margin + 2, diagramY + 4)
  diagramY += 10

  // Legend for B/W printing
  doc.setFontSize(7)
  doc.setTextColor(30, 41, 59)
  doc.text(language === 'es' ? 'Leyenda: B = Bueno | M = Malo | P = Pendiente' : 'Legend: G = Good | B = Bad | P = Pending', margin, diagramY)
  diagramY += 8

  // Draw truck diagram - use full page width and maximize height for better visibility
  // The image is horizontal (wide), so we use full width and calculate proportional height
  const diagramWidth = pageWidth - margin * 2
  const diagramHeight = 200 // Increased height for better visibility
  drawTruckDiagramPDF(doc, margin, diagramY, diagramWidth, diagramHeight, points, language, T, truckDiagramBase64)

  // ===== PAGE 3: SEAL PHOTO + SIGNATURES =====
  doc.addPage()
  drawHeader(doc, T, pageWidth, margin, logoBase64, ctpatLogoBase64, inspectionType, language)
  
  let sigY = 38

  // Seal photo section
  if (sealPhoto) {
    doc.setFillColor(...COLORS.gold)
    doc.rect(margin, sigY, pageWidth - margin * 2, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(T.sealPhoto, margin + 2, sigY + 4)
    sigY += 6

    try {
      // Center the seal photo
      const photoW = 100
      const photoH = 75
      const photoX = (pageWidth - photoW) / 2
      doc.addImage(sealPhoto, 'JPEG', photoX, sigY, photoW, photoH)
      sigY += photoH + 10
    } catch (e) { /* ignore */ }
  }

  // Signatures section title
  doc.setFillColor(...COLORS.navy)
  doc.rect(margin, sigY, pageWidth - margin * 2, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(T.signatures, margin + 2, sigY + 4)
  sigY += 10

  // Signatures (3 columns: operator, guard, auditor)
  const sigBoxW3 = (pageWidth - margin * 2 - 8) / 3
  const sigBoxH = 45
  drawSignatureBox(doc, margin, sigY, sigBoxW3, sigBoxH, T.operatorSig, operatorSignature, T)
  drawSignatureBox(doc, margin + sigBoxW3 + 4, sigY, sigBoxW3, sigBoxH, T.guardSig, guardSignature, T)
  drawSignatureBox(doc, margin + (sigBoxW3 + 4) * 2, sigY, sigBoxW3, sigBoxH, T.auditorSig, auditorSignature, T)

  // ===== FOOTER =====
  drawFooter(doc, T, pageWidth, pageHeight, margin)

  // Generate filename
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const trailer = (unitInfo.trailerNumber || 'NA').replace(/[^a-z0-9-]/gi, '_')
  const filename = `Inspeccion_${trailer}_${ts}.pdf`

  // Return doc without saving - let caller handle display/download
  return { filename, doc }
}

function drawHeader(doc, T, pageWidth, margin, logoBase64 = null, ctpatLogoBase64 = null, inspectionType = 'LOADED', language = 'es') {
  // Top navy bar
  doc.setFillColor(...COLORS.navyDark)
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Gold accent
  doc.setFillColor(...COLORS.gold)
  doc.rect(0, 28, pageWidth, 1.5, 'F')

  // Crown Xpress Logo (PNG image)
  const logoWidth = 55
  const logoHeight = 20
  const logoX = margin
  const logoY = 4
  
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight)
    } catch (e) {
      // Fallback to text if image fails
      drawFallbackLogo(doc, margin)
    }
  } else {
    // Fallback to text-based logo
    drawFallbackLogo(doc, margin)
  }

  // C-TPAT Logo (PNG image) - positioned to the right of Crown logo
  const ctpatLogoWidth = 35
  const ctpatLogoHeight = 20
  const ctpatLogoX = logoX + logoWidth + 8
  const ctpatLogoY = logoY
  
  if (ctpatLogoBase64) {
    try {
      doc.addImage(ctpatLogoBase64, 'PNG', ctpatLogoX, ctpatLogoY, ctpatLogoWidth, ctpatLogoHeight)
    } catch (e) {
      console.warn('Could not add C-TPAT logo:', e)
    }
  }

  // Right side - inspection title and form code
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(T.title, pageWidth - margin, 10, { align: 'right' })
  
  // Inspection type badge
  const typeConfig = INSPECTION_TYPES[inspectionType]
  const typeLabel = typeConfig ? typeConfig[language] : inspectionType
  doc.setFontSize(8)
  doc.setTextColor(201, 169, 97)
  doc.text(`[ ${typeLabel} ]`, pageWidth - margin, 16, { align: 'right' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(180, 180, 180)
  doc.text(T.formCode, pageWidth - margin, 22, { align: 'right' })
}

// Fallback logo when PNG is not available
function drawFallbackLogo(doc, margin) {
  // Draw simple crown shape
  doc.setFillColor(...COLORS.gold)
  const cx = margin + 10
  const cy = 14
  doc.triangle(cx - 8, cy + 6, cx, cy - 6, cx + 8, cy + 6, 'F')
  
  // Title text
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('CROWN XPRESS', margin + 22, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(201, 169, 97)
  doc.text('TRANSPORT · LOGISTICS', margin + 22, 18)
}

function drawFooter(doc, T, pageWidth, pageHeight, margin) {
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setDrawColor(...COLORS.gold)
    doc.setLineWidth(0.4)
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.slate)
    doc.text(`${T.generated}: ${new Date().toLocaleString()}`, margin, pageHeight - 7)
    doc.text(`${T.page} ${i} ${T.of} ${total}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
    doc.text('Crown Xpress Transport · ' + T.formCode, pageWidth / 2, pageHeight - 7, { align: 'center' })
  }
}

function drawSummaryBar(doc, x, y, w, T, good, bad, pending) {
  const segW = w / 3
  // Good
  doc.setFillColor(220, 252, 231)
  doc.rect(x, y, segW, 10, 'F')
  doc.setDrawColor(...COLORS.emerald)
  doc.rect(x, y, segW, 10)
  doc.setTextColor(...COLORS.emerald)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(good.toString(), x + segW / 2, y + 5, { align: 'center' })
  doc.setFontSize(7)
  doc.text(T.totalGood, x + segW / 2, y + 8.5, { align: 'center' })

  // Bad
  doc.setFillColor(254, 226, 226)
  doc.rect(x + segW, y, segW, 10, 'F')
  doc.setDrawColor(...COLORS.rose)
  doc.rect(x + segW, y, segW, 10)
  doc.setTextColor(...COLORS.rose)
  doc.setFontSize(11)
  doc.text(bad.toString(), x + segW * 1.5, y + 5, { align: 'center' })
  doc.setFontSize(7)
  doc.text(T.totalBad, x + segW * 1.5, y + 8.5, { align: 'center' })

  // Pending
  doc.setFillColor(241, 245, 249)
  doc.rect(x + segW * 2, y, segW, 10, 'F')
  doc.setDrawColor(...COLORS.slateLight)
  doc.rect(x + segW * 2, y, segW, 10)
  doc.setTextColor(...COLORS.slate)
  doc.setFontSize(11)
  doc.text(pending.toString(), x + segW * 2.5, y + 5, { align: 'center' })
  doc.setFontSize(7)
  doc.text(T.totalPending, x + segW * 2.5, y + 8.5, { align: 'center' })
}

function drawSignatureBox(doc, x, y, w, h, label, sig, T) {
  doc.setFillColor(...COLORS.navyDark)
  doc.rect(x, y, w, 5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text(label.toUpperCase(), x + 2, y + 3.5)

  // Box
  doc.setDrawColor(180, 200, 215)
  doc.setLineWidth(0.3)
  doc.rect(x, y + 5, w, h - 5)

  if (sig?.signature) {
    try {
      doc.addImage(sig.signature, 'PNG', x + 2, y + 6, w - 4, h - 13)
    } catch (e) { /* ignore */ }
  }

  // Name & date
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text(sig?.name || '—', x + 2, y + h - 3)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...COLORS.slate)
  doc.text(sig?.signedAt ? `${T.signedAt}: ${formatDate(sig.signedAt)}` : T.notSigned, x + w - 2, y + h - 3, { align: 'right' })
}

function formatDate(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    return d.toLocaleString()
  } catch {
    return value
  }
}

// Draw truck diagram for PDF with real image and B/W friendly markers
function drawTruckDiagramPDF(doc, x, y, w, h, points, language, T, truckDiagramBase64) {
  // Draw the truck diagram image
  if (truckDiagramBase64) {
    try {
      // The truck diagram image is horizontal (landscape orientation)
      // We want to display it horizontally on a vertical page
      // Image aspect ratio is approximately 2.2:1 (width:height)
      const aspectRatio = 2.2
      
      // Calculate dimensions to fit the width while maintaining aspect ratio
      const imgWidth = w
      const imgHeight = imgWidth / aspectRatio
      
      // Center the image vertically in the available space
      const imgY = y + (h - imgHeight - 30) / 2 // Leave space for legend
      
      doc.addImage(truckDiagramBase64, 'JPEG', x, imgY, imgWidth, imgHeight)
      
      // Point positions matching the TruckDiagramVisual.jsx positions (in percentages)
      // These match the exact positions from the visual component
      const pointPositions = [
        // TRACTOR POINTS (1-10)
        { id: 1, xPct: 13, yPct: 38 },      // Defensa - front of tractor
        { id: 2, xPct: 28.5, yPct: 38 },    // Llantas - tractor section
        { id: 3, xPct: 38, yPct: 47 },      // Piso - tractor cab
        { id: 4, xPct: 42.5, yPct: 47 },    // Tanques Diesel
        { id: 5, xPct: 26.5, yPct: 12 },    // Cabina - top of cab area
        { id: 6, xPct: 40.2, yPct: 16 },    // Tanques Aire
        { id: 7, xPct: 47, yPct: 27 },      // Quinta Rueda
        { id: 8, xPct: 55, yPct: 45 },      // Ejes Trans.
        { id: 9, xPct: 12, yPct: 13.5 },    // Escape
        { id: 10, xPct: 12, yPct: 24.2 },   // Motor
        // TRAILER POINTS (11-20)
        { id: 11, xPct: 55.2, yPct: 26 },   // Base Remolque
        { id: 12, xPct: 19.5, yPct: 87 },   // Puertas
        { id: 13, xPct: 91, yPct: 89 },     // Pared Der.
        { id: 14, xPct: 85.6, yPct: 8 },    // Techo
        { id: 15, xPct: 86.2, yPct: 89 },   // Pared Frontal
        { id: 16, xPct: 81.5, yPct: 89 },   // Pared Izq.
        { id: 17, xPct: 85.5, yPct: 55 },   // Piso Interior
        { id: 18, xPct: 55.5, yPct: 88 },   // Patín
        { id: 19, xPct: 50, yPct: 10 },     // Refrigeración
        { id: 20, xPct: 9.2, yPct: 87 },    // Limpieza
      ]
      
      // Draw point markers on the image
      pointPositions.forEach(pos => {
        const px = x + (pos.xPct / 100) * imgWidth
        const py = imgY + (pos.yPct / 100) * imgHeight
        const state = points[pos.id] || { status: null }
        drawPointMarker(doc, px, py, pos.id, state.status, language)
      })
      
      // Draw legend below image - matching the colors used in markers
      const legendY = imgY + imgHeight + 10
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      
      // Good legend (emerald green)
      doc.setFillColor(5, 150, 105)
      doc.setDrawColor(4, 120, 87)
      doc.setLineWidth(0.5)
      doc.circle(x + 20, legendY, 5, 'FD')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.text('B', x + 20, legendY + 1.8, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(0, 0, 0)
      doc.text(language === 'es' ? 'Bueno' : 'Good', x + 28, legendY + 2)

      // Bad legend (rose red)
      doc.setFillColor(225, 29, 72)
      doc.setDrawColor(190, 18, 60)
      doc.circle(x + 65, legendY, 5, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(255, 255, 255)
      doc.text('M', x + 65, legendY + 1.8, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(0, 0, 0)
      doc.text(language === 'es' ? 'Malo' : 'Bad', x + 73, legendY + 2)

      // Pending legend (slate gray)
      doc.setFillColor(148, 163, 184)
      doc.setDrawColor(100, 116, 139)
      doc.circle(x + 105, legendY, 5, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(255, 255, 255)
      doc.text('P', x + 105, legendY + 1.8, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(0, 0, 0)
      doc.text(language === 'es' ? 'Pendiente' : 'Pending', x + 113, legendY + 2)
      
    } catch (e) {
      console.warn('Could not draw truck diagram image:', e)
      // Fallback: draw simple text
      doc.setTextColor(100, 100, 100)
      doc.setFontSize(10)
      doc.text(language === 'es' ? 'DIAGRAMA NO DISPONIBLE' : 'DIAGRAM NOT AVAILABLE', x + w/2, y + h/2, { align: 'center' })
    }
  } else {
    // No image available - draw placeholder
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.rect(x, y, w, h * 0.85)
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(10)
    doc.text(language === 'es' ? 'IMAGEN DEL DIAGRAMA NO DISPONIBLE' : 'DIAGRAM IMAGE NOT AVAILABLE', x + w/2, y + h/2, { align: 'center' })
  }
}

// Draw individual point marker with number and status letter (e.g., "1B", "5M", "12P")
function drawPointMarker(doc, x, y, id, status, language) {
  const radius = 6 // Slightly larger to fit number + letter
  
  // Set fill based on status - using colors similar to the reference image
  if (status === 'good') {
    doc.setFillColor(5, 150, 105) // Emerald green for good
    doc.setDrawColor(4, 120, 87)
  } else if (status === 'bad') {
    doc.setFillColor(225, 29, 72) // Rose red for bad
    doc.setDrawColor(190, 18, 60)
  } else {
    doc.setFillColor(148, 163, 184) // Slate gray for pending
    doc.setDrawColor(100, 116, 139)
  }
  
  doc.setLineWidth(0.5)
  doc.circle(x, y, radius, 'FD')
  
  // Status letter (B=Bueno/G=Good, M=Malo/B=Bad, P=Pendiente/Pending)
  let statusLetter = 'P'
  if (status === 'good') {
    statusLetter = language === 'es' ? 'B' : 'G'
  } else if (status === 'bad') {
    statusLetter = language === 'es' ? 'M' : 'B'
  }
  
  // Show number + letter (e.g., "1B", "12M")
  const label = `${id}${statusLetter}`
  
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6) // Smaller font to fit both number and letter
  doc.text(label, x, y + 1.8, { align: 'center' })
}
