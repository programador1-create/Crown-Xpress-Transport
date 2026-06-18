// Backend endpoint for Gemini image verification
// Keeps API key secure on server side

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Try GEMINI_API_KEY first, then fall back to VITE_GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured on server')
    return res.status(503).json({
      valid: true,
      confidence: 0,
      message: 'AI verification not configured',
      suggestedIssues: [],
      skipped: true
    })
  }

  const { imageBase64, prompt } = req.body

  if (!imageBase64 || !prompt) {
    return res.status(400).json({ error: 'Missing imageBase64 or prompt' })
  }

  // Extract pure base64 data
  let base64Data = imageBase64
  if (imageBase64.startsWith('data:')) {
    base64Data = imageBase64.split(',')[1]
  }

  const maxRetries = 2

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.1
          }
        })
      })

      if (response.status === 429) {
        console.warn(`Gemini rate limited (attempt ${attempt + 1}/${maxRetries + 1})`)
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

      return res.status(200).json({
        valid: result.valid ?? true,
        confidence: result.confidence ?? 0,
        message: result.message || '',
        suggestedIssues: result.detectedIssues || [],
        recommendation: result.recommendation || ''
      })

    } catch (error) {
      console.error(`Gemini verification error (attempt ${attempt + 1}):`, error)
      if (attempt === maxRetries) {
        return res.status(200).json({
          valid: true,
          confidence: 0,
          message: 'AI verification unavailable',
          suggestedIssues: [],
          skipped: true
        })
      }
    }
  }
}
