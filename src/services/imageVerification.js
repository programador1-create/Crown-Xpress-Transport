// Image Verification Service using AI (Groq - LLaMA Vision)
// This service validates that captured photos match the expected inspection point

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * Verify if an image matches the expected inspection point using Groq
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {object} point - Inspection point object with id, es, en, keywords
 * @param {string} language - Current language ('es' or 'en')
 * @returns {Promise<{valid: boolean, confidence: number, message: string, suggestedIssues: number[]}>}
 */
export async function verifyInspectionImage(imageBase64, point, language = 'es') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  
  if (!apiKey) {
    console.warn('Groq API key not configured, skipping image verification')
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

  // Retry logic
  const maxRetries = 2
  let lastError = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }

      // Ensure proper base64 format with data URI
      const imageUrl = imageBase64.startsWith('data:') 
        ? imageBase64 
        : `data:image/jpeg;base64,${imageBase64}`

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.2-11b-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageUrl } }
              ]
            }
          ],
          max_tokens: 300,
          temperature: 0.1
        })
      })

      if (response.status === 429) {
        console.warn(`Groq rate limited (attempt ${attempt + 1}/${maxRetries + 1})`)
        lastError = new Error('Rate limited')
        continue
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Groq API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const textResponse = data.choices?.[0]?.message?.content || ''
      
      // Clean response (remove markdown if present)
      const cleanJson = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const result = JSON.parse(cleanJson)

      console.log('Groq verification result:', result)

      return {
        valid: result.valid ?? true,
        confidence: result.confidence ?? 0,
        message: result.message || '',
        suggestedIssues: result.detectedIssues || [],
        recommendation: result.recommendation || ''
      }
    } catch (error) {
      console.error(`Groq verification error (attempt ${attempt + 1}):`, error)
      lastError = error
    }
  }

  // All retries failed - return graceful fallback
  console.warn('Groq verification unavailable, skipping')
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
