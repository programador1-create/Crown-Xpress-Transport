import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// Inspection points data (simplified version for backend)
const INSPECTION_POINTS = {
  1: { es: 'Llantas delanteras', en: 'Front Tires' },
  2: { es: 'Llantas traseras', en: 'Rear Tires' },
  3: { es: 'Luces delanteras', en: 'Front Lights' },
  4: { es: 'Luces traseras', en: 'Rear Lights' },
  5: { es: 'Dirección', en: 'Steering' },
  6: { es: 'Frenos', en: 'Brakes' },
  7: { es: 'Espejos', en: 'Mirrors' },
  8: { es: 'Parabrisas', en: 'Windshield' },
  9: { es: 'Limpiaparabrisas', en: 'Wipers' },
  10: { es: 'Claxon', en: 'Horn' },
  11: { es: 'Cinturones de seguridad', en: 'Seat Belts' },
  12: { es: 'Extintor', en: 'Fire Extinguisher' },
  13: { es: 'Triángulos de emergencia', en: 'Emergency Triangles' },
  14: { es: 'Llanta de refacción', en: 'Spare Tire' },
  15: { es: 'Gato', en: 'Jack' },
  16: { es: 'Caja de herramientas', en: 'Toolbox' },
  17: { es: 'Cadenas', en: 'Chains' },
  18: { es: 'Patín', en: 'Skid Plate' },
  19: { es: 'Cinturones de carga', en: 'Load Straps' },
  20: { es: 'Otros', en: 'Others' },
}

// Get truck diagram path based on inspection type
function getTruckDiagramPath(inspectionType, trailerType) {
  const publicDir = path.join(__dirname, '../../public')
  
  if (trailerType === 'RABON') {
    return path.join(publicDir, 'Origen_Rabon.png')
  }
  
  switch (inspectionType) {
    case 'LOADED':
      return path.join(publicDir, 'Gemini_Generated_Image_nwvt4xnwvt4xnwvt.jpg')
    case 'EMPTY':
      return path.join(publicDir, 'Vacio-Contenedor-Caja.jpg')
    case 'BOBTAIL':
      return path.join(publicDir, 'Botado Trailer.jpg')
    case 'FLATBED':
      return path.join(publicDir, 'Plataforma vacia-cargada.jpg')
    default:
      return path.join(publicDir, 'Gemini_Generated_Image_nwvt4xnwvt4xnwvt.jpg')
  }
}

// Convert image file to base64
function imageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath)
    return `data:image/${path.extname(imagePath).slice(1)};base64,${imageBuffer.toString('base64')}`
  } catch (e) {
    console.warn('Could not load image:', imagePath, e)
    return null
  }
}

// Generate PDF for inspection
export async function generateInspectionPDF(data) {
  const {
    unitInfo = {},
    points = {},
    sealPhoto = null,
    guardSignature = {},
    supervisorSignature = {},
    operatorSignature = {},
    language = 'es',
    yardCode = '',
  } = data

  const doc = new jsPDF('p', 'mm', 'letter')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Load logos
  const crownLogoPath = path.join(__dirname, '../../public/crown-logo.png')
  const ctpatLogoPath = path.join(__dirname, '../../public/ctpat-logo.png')
  const crownLogo = imageToBase64(crownLogoPath)
  const ctpatLogo = imageToBase64(ctpatLogoPath)

  // Load truck diagram
  const truckDiagramPath = getTruckDiagramPath(unitInfo.inspectionType, unitInfo.trailerType)
  const truckDiagram = imageToBase64(truckDiagramPath)

  // Header with logos
  if (crownLogo) {
    doc.addImage(crownLogo, 'PNG', 10, 10, 30, 15)
  }
  if (ctpatLogo) {
    doc.addImage(ctpatLogo, 'PNG', pageWidth - 40, 10, 30, 15)
  }

  // Title
  doc.setFontSize(18)
  doc.setTextColor(...COLORS.navy)
  doc.text(language === 'es' ? 'REPORTE DE INSPECCIÓN' : 'INSPECTION REPORT', pageWidth / 2, 25, { align: 'center' })

  // Inspection info
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.slate)
  let yPos = 35

  const infoFields = [
    { label: language === 'es' ? 'Fecha:' : 'Date:', value: unitInfo.inspectionDate || new Date().toLocaleDateString() },
    { label: language === 'es' ? 'Unidad:' : 'Unit:', value: unitInfo.equipmentNomenclature || unitInfo.trailerNumber || '-' },
    { label: language === 'es' ? 'Tipo:' : 'Type:', value: unitInfo.inspectionType || '-' },
    { label: language === 'es' ? 'Conductor:' : 'Driver:', value: unitInfo.driverName || '-' },
    { label: language === 'es' ? 'Guardia:' : 'Guard:', value: guardSignature.name || '-' },
    { label: language === 'es' ? 'Yarda:' : 'Yard:', value: yardCode || unitInfo.location || '-' },
  ]

  infoFields.forEach((field, index) => {
    if (index % 2 === 0) {
      doc.text(field.label, 15, yPos)
      doc.text(field.value, 50, yPos)
    } else {
      doc.text(field.label, pageWidth / 2 + 10, yPos)
      doc.text(field.value, pageWidth / 2 + 45, yPos)
      yPos += 6
    }
  })

  yPos += 5

  // Truck diagram
  if (truckDiagram) {
    doc.addImage(truckDiagram, 'JPEG', 15, yPos, pageWidth - 30, 60)
    yPos += 65
  }

  // Inspection points table
  const tableData = Object.entries(points).map(([id, point]) => [
    id,
    INSPECTION_POINTS[id]?.[language] || INSPECTION_POINTS[id]?.es || `Point ${id}`,
    point.status === 'good' ? (language === 'es' ? 'OK' : 'OK') : (language === 'es' ? 'FALLA' : 'FAIL'),
    point.issueText || '-',
  ])

  autoTable(doc, {
    startY: yPos,
    head: [[language === 'es' ? '#' : '#', language === 'es' ? 'Punto' : 'Point', language === 'es' ? 'Estado' : 'Status', language === 'es' ? 'Notas' : 'Notes']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: COLORS.navy, textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
  })

  yPos = doc.lastAutoTable.finalY + 10

  // Signatures
  if (guardSignature.signature) {
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.slate)
    doc.text(language === 'es' ? 'Firma del Guardia:' : 'Guard Signature:', 15, yPos)
    doc.addImage(guardSignature.signature, 'PNG', 15, yPos + 5, 40, 20)
    doc.text(guardSignature.name || '-', 15, yPos + 28)
    yPos += 35
  }

  if (supervisorSignature.signature) {
    doc.text(language === 'es' ? 'Firma del Supervisor:' : 'Supervisor Signature:', 15, yPos)
    doc.addImage(supervisorSignature.signature, 'PNG', 15, yPos + 5, 40, 20)
    doc.text(supervisorSignature.name || '-', 15, yPos + 28)
    yPos += 35
  }

  if (operatorSignature.signature) {
    doc.text(language === 'es' ? 'Firma del Operador:' : 'Operator Signature:', 15, yPos)
    doc.addImage(operatorSignature.signature, 'PNG', 15, yPos + 5, 40, 20)
    doc.text(operatorSignature.name || '-', 15, yPos + 28)
  }

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `inspection_${unitInfo.equipmentNomenclature || unitInfo.trailerNumber || 'unknown'}_${timestamp}.pdf`

  return {
    doc,
    filename,
  }
}
