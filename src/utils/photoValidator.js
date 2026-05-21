/**
 * Basic photo validator - checks if a captured photo is valid:
 * - Not too dark (suggests pointing at floor/ceiling/covered lens)
 * - Not too uniform (suggests pointing at solid surface like floor/sky)
 * - Has reasonable contrast/edge content
 *
 * Returns: { valid: boolean, reason?: string, score: number }
 */
export async function validatePhoto(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const w = canvas.width = 64
      const h = canvas.height = 64
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      
      const imageData = ctx.getImageData(0, 0, w, h)
      const data = imageData.data
      const total = w * h
      
      // 1. Average brightness
      let sumBrightness = 0
      const brightnesses = []
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2]
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114)
        sumBrightness += brightness
        brightnesses.push(brightness)
      }
      const avgBrightness = sumBrightness / total
      
      // 2. Standard deviation (variation)
      let variance = 0
      for (const b of brightnesses) {
        variance += (b - avgBrightness) ** 2
      }
      const stdDev = Math.sqrt(variance / total)
      
      // 3. Edge detection (basic Sobel-like)
      let edgeCount = 0
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = (y * w + x) * 4
          const left = data[i - 4]
          const right = data[i + 4]
          const up = data[i - w * 4]
          const down = data[i + w * 4]
          const dx = Math.abs(right - left)
          const dy = Math.abs(down - up)
          if (dx + dy > 30) edgeCount++
        }
      }
      const edgeRatio = edgeCount / total
      
      // Validation rules
      // Too dark - probably covered lens or pointing at floor
      if (avgBrightness < 25) {
        return resolve({
          valid: false,
          reason: 'too_dark',
          score: 0,
          metrics: { avgBrightness, stdDev, edgeRatio }
        })
      }
      
      // Too bright/washed out
      if (avgBrightness > 240) {
        return resolve({
          valid: false,
          reason: 'too_bright',
          score: 0,
          metrics: { avgBrightness, stdDev, edgeRatio }
        })
      }
      
      // Too uniform - looks like solid floor, sky, or wall (likely wrong target)
      if (stdDev < 12) {
        return resolve({
          valid: false,
          reason: 'too_uniform',
          score: 0.3,
          metrics: { avgBrightness, stdDev, edgeRatio }
        })
      }
      
      // No edges - blurred or solid surface
      if (edgeRatio < 0.05) {
        return resolve({
          valid: false,
          reason: 'no_detail',
          score: 0.4,
          metrics: { avgBrightness, stdDev, edgeRatio }
        })
      }
      
      // Photo passes all checks
      const score = Math.min(1, (stdDev / 60) * 0.5 + Math.min(edgeRatio * 5, 1) * 0.5)
      resolve({
        valid: true,
        score,
        metrics: { avgBrightness, stdDev, edgeRatio }
      })
    }
    img.onerror = () => resolve({ valid: false, reason: 'load_error', score: 0 })
    img.src = dataUrl
  })
}

export const validationReasons = {
  es: {
    too_dark: 'La foto es demasiado oscura. Asegúrate de tener buena iluminación y de no cubrir la lente.',
    too_bright: 'La foto está sobreexpuesta. Evita apuntar directamente al sol o luces fuertes.',
    too_uniform: 'La foto parece mostrar una superficie uniforme (piso, cielo o pared lisa). Apunta hacia el área a inspeccionar.',
    no_detail: 'La foto no muestra suficiente detalle. Acércate más al área y enfoca correctamente.',
    load_error: 'No se pudo procesar la imagen. Vuelve a intentar.',
  },
  en: {
    too_dark: 'The photo is too dark. Ensure good lighting and that the lens is not covered.',
    too_bright: 'The photo is overexposed. Avoid pointing directly at sun or bright lights.',
    too_uniform: 'The photo appears to show a uniform surface (floor, sky, or plain wall). Point toward the inspection area.',
    no_detail: 'The photo lacks detail. Move closer to the area and focus correctly.',
    load_error: 'Could not process the image. Please try again.',
  }
}
