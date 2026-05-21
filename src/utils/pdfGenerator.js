import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { inspectionPoints, errorReports } from '../data/inspectionPoints'

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

export async function generateInspectionPDF({ unitInfo, points, sealPhoto, guardSignature, auditorSignature, language = 'es' }) {
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
    guardSig: 'Guardia',
    auditorSig: 'Auditor',
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
    guardSig: 'Guard',
    auditorSig: 'Auditor',
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

  // ===== HEADER =====
  drawHeader(doc, T, pageWidth, margin)

  let y = 38

  // ===== UNIT INFO =====
  doc.setFillColor(...COLORS.navy)
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(T.unitInfo, margin + 2, y + 4)
  y += 6

  const infoRows = [
    [T.trailerNumber, unitInfo.trailerNumber || '—', T.sealNumber, unitInfo.sealNumber || '—'],
    [T.driverName, unitInfo.driverName || '—', T.date, formatDate(unitInfo.inspectionDate)],
    [T.odometer, unitInfo.odometer || '—', T.location, unitInfo.location || '—'],
    [T.highSecuritySeal, unitInfo.highSecuritySeal === 'yes' ? T.yes : T.no, T.sealAffixed, unitInfo.sealAffixed === 'yes' ? T.yes : T.no],
  ]

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
  const goodCount = Object.values(points).filter(p => p.status === 'good').length
  const badCount = Object.values(points).filter(p => p.status === 'bad').length
  const pendingCount = inspectionPoints.length - goodCount - badCount

  drawSummaryBar(doc, margin, y, pageWidth - margin * 2, T, goodCount, badCount, pendingCount)
  y += 12

  // ===== INSPECTION TABLE =====
  doc.setFillColor(...COLORS.navy)
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(T.inspectionTitle, margin + 2, y + 4)
  y += 6

  const tableBody = inspectionPoints.map(p => {
    const state = points[p.id] || { status: null, issueId: null }
    const statusText = state.status === 'good' ? T.good : state.status === 'bad' ? T.bad : T.pending
    const issue = errorReports.find(e => e.id === state.issueId)
    return [
      p.id.toString(),
      p[language],
      statusText,
      issue ? issue[language] : ''
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
      drawHeader(doc, T, pageWidth, margin)
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
      const issue = errorReports.find(e => e.id === state.issueId)
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (photoW + gap)
      const cellY = y + row * (photoH + 22)

      if (cellY + photoH + 22 > pageHeight - 25) {
        doc.addPage()
        drawHeader(doc, T, pageWidth, margin)
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

  // ===== SEAL PHOTO + SIGNATURES =====
  if (y > pageHeight - 70) {
    doc.addPage()
    drawHeader(doc, T, pageWidth, margin)
    y = 38
  }

  // Seal photo (left)
  const sigSectionY = y
  const sigBoxW = (pageWidth - margin * 2 - 4) / 2

  if (sealPhoto) {
    doc.setFillColor(...COLORS.gold)
    doc.rect(margin, sigSectionY, sigBoxW, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(T.sealPhoto, margin + 2, sigSectionY + 4)

    try {
      doc.addImage(sealPhoto, 'JPEG', margin, sigSectionY + 6, sigBoxW, 50)
    } catch (e) { /* ignore */ }
  }

  // Signatures (right column - guard top, auditor bottom)
  const sigX = margin + sigBoxW + 4
  drawSignatureBox(doc, sigX, sigSectionY, sigBoxW, 28, T.guardSig, guardSignature, T)
  drawSignatureBox(doc, sigX, sigSectionY + 28, sigBoxW, 28, T.auditorSig, auditorSignature, T)

  // ===== FOOTER =====
  drawFooter(doc, T, pageWidth, pageHeight, margin)

  // Generate filename
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const trailer = (unitInfo.trailerNumber || 'NA').replace(/[^a-z0-9-]/gi, '_')
  const filename = `Inspeccion_${trailer}_${ts}.pdf`

  doc.save(filename)
  return { filename, doc }
}

function drawHeader(doc, T, pageWidth, margin) {
  // Top navy bar
  doc.setFillColor(...COLORS.navyDark)
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Gold accent
  doc.setFillColor(...COLORS.gold)
  doc.rect(0, 28, pageWidth, 1.5, 'F')

  // Crown emblem
  doc.setDrawColor(...COLORS.gold)
  doc.setFillColor(...COLORS.gold)
  const cx = margin + 6, cy = 14
  doc.triangle(cx - 6, cy + 6, cx, cy - 8, cx + 6, cy + 6, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('CROWN XPRESS', margin + 18, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(201, 169, 97)
  doc.text('TRANSPORT · LOGISTICS', margin + 18, 19)

  // Right side title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(T.title, pageWidth - margin, 13, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(201, 169, 97)
  doc.text(T.formCode, pageWidth - margin, 18, { align: 'right' })
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
