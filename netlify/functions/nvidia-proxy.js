const NVIDIA_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions'
const ALLOWED_MODELS = new Set(['meta/llama-3.3-70b-instruct'])
const MAX_BODY_BYTES = 32 * 1024
const MAX_API_KEY_LENGTH = 4096
const MAX_PROMPT_BYTES = 24 * 1024
const UPSTREAM_TIMEOUT_MS = 40_000

async function readLimitedBody(request) {
  if (!request.body) return { tooLarge: false, body: '' }
  const reader = request.body.getReader()
  const chunks = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel()
      return { tooLarge: true, body: '' }
    }
    chunks.push(value)
  }

  const body = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return { tooLarge: false, body: new TextDecoder().decode(body) }
}

function jsonResponse(statusCode, payload) {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export default async function nvidiaProxy(request) {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Méthode non autorisée.' })
  }

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonResponse(415, { error: 'Le corps doit être envoyé au format JSON.' })
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return jsonResponse(413, { error: 'La requête est trop volumineuse.' })
  }

  let rawBody
  try {
    const result = await readLimitedBody(request)
    if (result.tooLarge) return jsonResponse(413, { error: 'La requête est trop volumineuse.' })
    rawBody = result.body
  } catch {
    return jsonResponse(400, { error: 'Impossible de lire la requête.' })
  }

  let input
  try {
    input = JSON.parse(rawBody)
  } catch {
    return jsonResponse(400, { error: 'Le JSON de la requête est invalide.' })
  }

  const apiKey = typeof input.apiKey === 'string' ? input.apiKey.trim() : ''
  const model = typeof input.model === 'string' ? input.model : ''
  const prompt = typeof input.prompt === 'string' ? input.prompt : ''

  if (!apiKey || apiKey.length > MAX_API_KEY_LENGTH) {
    return jsonResponse(400, { error: 'Clé NVIDIA absente ou invalide.' })
  }
  if (!prompt.trim()) {
    return jsonResponse(400, { error: 'Le prompt ne peut pas être vide.' })
  }
  if (new TextEncoder().encode(prompt).byteLength > MAX_PROMPT_BYTES) {
    return jsonResponse(413, { error: 'Le prompt dépasse la taille autorisée.' })
  }
  if (!ALLOWED_MODELS.has(model)) {
    return jsonResponse(400, { error: 'Modèle NVIDIA non autorisé.' })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const upstream = await fetch(NVIDIA_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 512,
        stream: false,
      }),
      signal: controller.signal,
    })

    const responseBody = await upstream.text()
    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    if (controller.signal.aborted) {
      return jsonResponse(504, { error: 'Le service NVIDIA n’a pas répondu dans le délai autorisé.' })
    }
    return jsonResponse(502, { error: 'Impossible de joindre le service NVIDIA.' })
  } finally {
    clearTimeout(timeout)
  }
}
