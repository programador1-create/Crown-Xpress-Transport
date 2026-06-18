const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

// Respuesta de fallback reutilizable
const SKIP_RESPONSE = {
  valid: true,
  confidence: 0,
  message: 'AI verification unavailable',
  suggestedIssues: [],
  skipped: true
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured')
    return res.status(200).json({ ...SKIP_RESPONSE, message: 'AI verification not configured' })
  }

  const { imageBase64, prompt } = req.body
  if (!imageBase64 || !prompt) {
    return res.status(400).json({ error: 'Missing imageBase64 or prompt' })
  }

  let base64Data = imageBase64.startsWith('data:')
    ? imageBase64.split(',')[1]
    : imageBase64

  // Helper con timeout propio
  async function callGemini() {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 7000) // 7s max por intento

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
            ]
          }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.1 }
        })
      })

      if (response.status === 429) return { rateLimited: true }
      if (!response.ok) throw new Error(`Gemini ${response.status}`)

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return { result: JSON.parse(clean) }

    } finally {
      clearTimeout(timer)
    }
  }

  // Solo 1 reintento, delay corto
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1000)) // fijo 1s, no exponencial

      const { result, rateLimited } = await callGemini()

      if (rateLimited) {
        console.warn(`Gemini rate limited (attempt ${attempt + 1})`)
        continue
      }

      return res.status(200).json({
        valid: result.valid ?? true,
        confidence: result.confidence ?? 0,
        message: result.message || '',
        suggestedIssues: result.detectedIssues || [],
        recommendation: result.recommendation || ''
      })

    } catch (error) {
      const reason = error.name === 'AbortError' ? 'timeout' : error.message
      console.error(`Gemini attempt ${attempt + 1} failed: ${reason}`)
    }
  }

  // Si todo falló, responde 200 para no bloquear el flujo
  return res.status(200).json(SKIP_RESPONSE)
}