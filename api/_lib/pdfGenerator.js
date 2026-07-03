import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
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

// Applicable points for each trailer type
const APPLICABLE_POINTS = {
  RABON: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  DEFAULT: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
}

// Get applicable points based on trailer type
function getApplicablePoints(trailerType) {
  if (trailerType === 'RABON') {
    return APPLICABLE_POINTS.RABON
  }
  return APPLICABLE_POINTS.DEFAULT
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
    if (!fs.existsSync(imagePath)) {
      console.warn('Image file not found:', imagePath)
      return null
    }
    const imageBuffer = fs.readFileSync(imagePath)
    if (!imageBuffer || imageBuffer.length < 10) {
      console.warn('Image file too small or empty:', imagePath, imageBuffer?.length)
      return null
    }
    // Validate image signature (PNG or JPEG)
    const isPng = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4e && imageBuffer[3] === 0x47
    const isJpg = imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8
    if (!isPng && !isJpg) {
      console.warn('Image file does not have valid PNG/JPEG signature:', imagePath)
      return null
    }
    const format = isPng ? 'png' : 'jpeg'
    return `data:image/${format};base64,${imageBuffer.toString('base64')}`
  } catch (e) {
    console.warn('Could not load image:', imagePath, e)
    return null
  }
}

// Safe wrapper around jsPDF addImage to avoid failing the whole PDF if one image is corrupt
function safeAddImage(doc, imageData, fallbackFormat, x, y, w, h) {
  if (!imageData) return false
  try {
    const fmt = detectImageFormat(imageData) || fallbackFormat
    doc.addImage(imageData, fmt, x, y, w, h)
    return true
  } catch (imgError) {
    console.warn('addImage failed (format:', detectImageFormat(imageData) || fallbackFormat, '):', imgError.message)
    return false
  }
}

// Detect image format from base64 data URI (supports PNG/JPEG)
function detectImageFormat(base64Data) {
  if (!base64Data) return null
  const str = String(base64Data)
  if (str.startsWith('data:image/png')) return 'PNG'
  if (str.startsWith('data:image/jpeg') || str.startsWith('data:image/jpg')) return 'JPEG'
  // Fallback: assume PNG for signatures (legacy), JPEG for other images
  return 'PNG'
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

  console.log('PDF Generator - trailerType:', unitInfo.trailerType)
  console.log('PDF Generator - points keys:', Object.keys(points))
  console.log('PDF Generator - guardSignature signature length:', guardSignature.signature?.length || 0)
  console.log('PDF Generator - supervisorSignature signature length:', supervisorSignature.signature?.length || 0)
  console.log('PDF Generator - operatorSignature signature length:', operatorSignature.signature?.length || 0)

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
  safeAddImage(doc, crownLogo, 'PNG', 10, 10, 30, 15)
  safeAddImage(doc, ctpatLogo, 'PNG', pageWidth - 40, 10, 30, 15)

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
  if (safeAddImage(doc, truckDiagram, 'JPEG', 15, yPos, pageWidth - 30, 60)) {
    yPos += 65
  }

  // Inspection points table - filter by applicable points for trailer type
  const applicablePointIds = getApplicablePoints(unitInfo.trailerType)
  const tableData = Object.entries(points)
    .filter(([id]) => applicablePointIds.includes(parseInt(id)))
    .map(([id, point]) => [
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
    if (safeAddImage(doc, guardSignature.signature, 'PNG', 15, yPos + 5, 40, 20)) {
      doc.text(guardSignature.name || '-', 15, yPos + 28)
      yPos += 35
    }
  }

  if (supervisorSignature.signature) {
    doc.text(language === 'es' ? 'Firma del Supervisor:' : 'Supervisor Signature:', 15, yPos)
    if (safeAddImage(doc, supervisorSignature.signature, 'PNG', 15, yPos + 5, 40, 20)) {
      doc.text(supervisorSignature.name || '-', 15, yPos + 28)
      yPos += 35
    }
  }

  if (operatorSignature.signature) {
    doc.text(language === 'es' ? 'Firma del Operador:' : 'Operator Signature:', 15, yPos)
    if (safeAddImage(doc, operatorSignature.signature, 'PNG', 15, yPos + 5, 40, 20)) {
      doc.text(operatorSignature.name || '-', 15, yPos + 28)
    }
  }

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `inspection_${unitInfo.equipmentNomenclature || unitInfo.trailerNumber || 'unknown'}_${timestamp}.pdf`

  return {
    doc,
    filename,
  }
}
