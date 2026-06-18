// Image Verification Service - calls backend to keep API key secure
// Backend handles Gemini API communication

/**
 * Verify if an image matches the expected inspection point via backend
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {object} point - Inspection point object with id, es, en, keywords
 * @param {string} language - Current language ('es' or 'en')
 * @returns {Promise<{valid: boolean, confidence: number, message: string, suggestedIssues: number[]}>}
 */
export async function verifyInspectionImage(imageBase64, point, language = 'es') {
  const pointName = point[language]
  const keywords = point.keywords || []
  const issues = point.issues || []

  const prompt = language === 'es'
    ? `Eres un inspector de seguridad de transporte. Analiza esta imagen para el punto de inspección: "${pointName}".
Palabras clave: ${keywords.join(', ')}
Posibles fallas: ${issues.map((i, idx) => `${idx + 1}. ${i.es}`).join(', ')}

Responde SOLO con JSON válido (sin markdown):
{"valid": true/false, "confidence": 0-100, "message": "explicación breve", "detectedIssues": [], "recommendation": ""}`
    : `You are a transportation security inspector. Analyze this image for: "${pointName}".
Keywords: ${keywords.join(', ')}
Possible issues: ${issues.map((i, idx) => `${idx + 1}. ${i.en}`).join(', ')}

Respond ONLY with valid JSON (no markdown):
{"valid": true/false, "confidence": 0-100, "message": "brief explanation", "detectedIssues": [], "recommendation": ""}`

  try {
    const response = await fetch('/api/verify-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, prompt })
    })

    if (!response.ok) {
      console.warn('Backend verification failed:', response.status)
      return {
        valid: true,
        confidence: 0,
        message: language === 'es' ? 'Verificación IA no disponible' : 'AI verification unavailable',
        suggestedIssues: [],
        skipped: true
      }
    }

    const result = await response.json()
    console.log('AI verification result:', result)
    return result

  } catch (error) {
    console.error('AI verification error:', error)
    return {
      valid: true,
      confidence: 0,
      message: language === 'es' ? 'Verificación IA no disponible' : 'AI verification unavailable',
      suggestedIssues: [],
      skipped: true
    }
  }
}

/**
 * Quick validation without full AI analysis (checks basic image properties)
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {{valid: boolean, message: string}}
 */
export function quickValidateImage(imageBase64) {
  if (!imageBase64) {
    return { valid: false, message: 'No image provided' }
  }

  // Check if it's a valid base64 image
  if (!imageBase64.startsWith('data:image/')) {
    return { valid: false, message: 'Invalid image format' }
  }

  // Check minimum size (rough estimate - at least 10KB for a meaningful photo)
  const base64Data = imageBase64.split(',')[1] || ''
  const sizeInBytes = (base64Data.length * 3) / 4
  if (sizeInBytes < 10000) {
    return { valid: false, message: 'Image too small or low quality' }
  }

  return { valid: true, message: 'Image appears valid' }
}
