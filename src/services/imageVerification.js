// Image Verification Service using AI (Gemini)
// This service validates that captured photos match the expected inspection point

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

/**
 * Verify if an image matches the expected inspection point using Google Gemini
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {object} point - Inspection point object with id, es, en, keywords
 * @param {string} language - Current language ('es' or 'en')
 * @returns {Promise<{valid: boolean, confidence: number, message: string, suggestedIssues: number[]}>}
 */
export async function verifyInspectionImage(imageBase64, point, language = 'es') {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  
  if (!apiKey) {
    console.warn('Gemini API key not configured, skipping image verification')
    return {
      valid: true,
      confidence: 0,
      message: language === 'es' 
        ? 'Verificación de IA no disponible' 
        : 'AI verification not available',
      suggestedIssues: []
    }
  }

  const pointName = point[language]
  const keywords = point.keywords || []
  const issues = point.issues || []

  const prompt = language === 'es' 
    ? `Eres un inspector de seguridad de transporte especializado en inspecciones de tractocamiones y remolques.

Analiza esta imagen para el punto de inspección: "${pointName}"
Palabras clave esperadas: ${keywords.join(', ')}

Posibles fallas para este punto:
${issues.map((i, idx) => `${idx + 1}. ${i.es}`).join('\n')}

Responde SOLO con un JSON válido (sin markdown, sin \`\`\`):
{"valid": true/false, "confidence": 0-100, "message": "explicación breve", "detectedIssues": [], "recommendation": ""}`
    : `You are a transportation security inspector specialized in tractor and trailer inspections.

Analyze this image for the inspection point: "${pointName}"
Expected keywords: ${keywords.join(', ')}

Possible issues for this point:
${issues.map((i, idx) => `${idx + 1}. ${i.en}`).join('\n')}

Respond ONLY with valid JSON (no markdown, no \`\`\`):
{"valid": true/false, "confidence": 0-100, "message": "brief explanation", "detectedIssues": [], "recommendation": ""}`

  // Retry logic
  const maxRetries = 2
  let lastError = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }

      // Extract base64 data without prefix
      const base64Data = imageBase64.includes(',') 
        ? imageBase64.split(',')[1] 
        : imageBase64

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500
          }
        })
      })

      if (response.status === 429) {
        console.warn(`Gemini rate limited (attempt ${attempt + 1}/${maxRetries + 1})`)
        lastError = new Error('Rate limited')
        continue
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      // Clean response (remove markdown if present)
      const cleanJson = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const result = JSON.parse(cleanJson)

      console.log('Gemini verification result:', result)

      return {
        valid: result.valid ?? true,
        confidence: result.confidence ?? 0,
        message: result.message || '',
        suggestedIssues: result.detectedIssues || [],
        recommendation: result.recommendation || ''
      }
    } catch (error) {
      console.error(`Gemini verification error (attempt ${attempt + 1}):`, error)
      lastError = error
    }
  }

  // All retries failed - return graceful fallback
  console.warn('Gemini verification unavailable, skipping')
  return {
    valid: true,
    confidence: 0,
    message: language === 'es' 
      ? 'Verificación IA no disponible' 
      : 'AI verification unavailable',
    suggestedIssues: [],
    skipped: true
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
