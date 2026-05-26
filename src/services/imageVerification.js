// Image Verification Service using AI
// This service validates that captured photos match the expected inspection point

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * Verify if an image matches the expected inspection point
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {object} point - Inspection point object with id, es, en, keywords
 * @param {string} language - Current language ('es' or 'en')
 * @returns {Promise<{valid: boolean, confidence: number, message: string, suggestedIssues: number[]}>}
 */
export async function verifyInspectionImage(imageBase64, point, language = 'es') {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  
  if (!apiKey) {
    console.warn('OpenAI API key not configured, skipping image verification')
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

  const systemPrompt = language === 'es' 
    ? `Eres un inspector de seguridad de transporte especializado en inspecciones de tractocamiones y remolques. 
Tu tarea es verificar si la imagen proporcionada corresponde al punto de inspección indicado.

Punto de inspección: "${pointName}"
Palabras clave esperadas: ${keywords.join(', ')}

Posibles fallas para este punto:
${issues.map((i, idx) => `${idx + 1}. ${i.es}`).join('\n')}

Responde en formato JSON con:
{
  "valid": true/false (si la imagen corresponde al punto de inspección),
  "confidence": 0-100 (nivel de confianza),
  "message": "explicación breve",
  "detectedIssues": [números de las fallas detectadas si las hay],
  "recommendation": "recomendación si la imagen no es válida"
}`
    : `You are a transportation security inspector specialized in tractor and trailer inspections.
Your task is to verify if the provided image corresponds to the indicated inspection point.

Inspection point: "${pointName}"
Expected keywords: ${keywords.join(', ')}

Possible issues for this point:
${issues.map((i, idx) => `${idx + 1}. ${i.en}`).join('\n')}

Respond in JSON format with:
{
  "valid": true/false (if the image corresponds to the inspection point),
  "confidence": 0-100 (confidence level),
  "message": "brief explanation",
  "detectedIssues": [numbers of detected issues if any],
  "recommendation": "recommendation if image is not valid"
}`

  // Retry logic for rate limiting
  const maxRetries = 2
  let lastError = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wait before retry (exponential backoff)
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: language === 'es' 
                    ? `Analiza esta imagen para el punto de inspección "${pointName}". ¿La imagen muestra correctamente este componente? ¿Detectas alguna falla?`
                    : `Analyze this image for the inspection point "${pointName}". Does the image correctly show this component? Do you detect any issues?`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'low'
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          response_format: { type: 'json_object' }
        })
      })

      // Handle rate limiting (429)
      if (response.status === 429) {
        console.warn(`Rate limited (attempt ${attempt + 1}/${maxRetries + 1})`)
        lastError = new Error('Rate limited')
        continue
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)

      return {
        valid: result.valid ?? true,
        confidence: result.confidence ?? 0,
        message: result.message || '',
        suggestedIssues: result.detectedIssues || [],
        recommendation: result.recommendation || ''
      }
    } catch (error) {
      console.error(`Image verification error (attempt ${attempt + 1}):`, error)
      lastError = error
    }
  }

  // All retries failed - return graceful fallback
  console.warn('AI verification unavailable, skipping')
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
