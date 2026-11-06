export type NvidiaChatErrorCode = 'unauthorized' | 'forbidden' | 'rate_limit' | 'server' | 'network' | 'timeout' | 'invalid_response' | 'request_failed'
export class NvidiaChatError extends Error {
  constructor(message: string, readonly code: NvidiaChatErrorCode, readonly status?: number) { super(message); this.name = 'NvidiaChatError' }
}
type NvidiaChatCompletionOptions = { apiKey: string; prompt: string; model: string; fetchImpl?: typeof fetch; timeoutMs?: number }
type NvidiaChatCompletionResponse = { choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }> }
function errorForStatus(status: number): NvidiaChatError {
  if (status === 401) return new NvidiaChatError('Clé NVIDIA invalide ou expirée (HTTP 401). Vérifiez-la dans le gestionnaire de clés.', 'unauthorized', status)
  if (status === 403) return new NvidiaChatError('Accès refusé par NVIDIA (HTTP 403). Vérifiez les autorisations du compte et du modèle.', 'forbidden', status)
  if (status === 429) return new NvidiaChatError('Limite de débit ou quota NVIDIA atteint (HTTP 429). Réessayez plus tard et vérifiez votre compte.', 'rate_limit', status)
  if (status === 504) return new NvidiaChatError('La requête NVIDIA a dépassé le délai autorisé. Réessayez.', 'timeout', status)
  if (status === 502) return new NvidiaChatError('Connexion au service NVIDIA impossible depuis le proxy. Réessayez.', 'network', status)
  if (status >= 500) return new NvidiaChatError(`Le service NVIDIA rencontre une erreur (HTTP ${status}). Réessayez plus tard.`, 'server', status)
  return new NvidiaChatError(`La requête NVIDIA a échoué (HTTP ${status}). Vérifiez le modèle et les paramètres.`, 'request_failed', status)
}
export async function sendNvidiaChatCompletion({ apiKey, prompt, model, fetchImpl = fetch, timeoutMs = 45_000 }: NvidiaChatCompletionOptions): Promise<string> {
  if (!apiKey.trim()) throw new NvidiaChatError('Ajoutez une clé NVIDIA NIM avant d’envoyer un message.', 'unauthorized')
  if (!prompt.trim()) throw new NvidiaChatError('Saisissez un message avant de lancer la requête.', 'request_failed')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    let response: Response
    try {
      response = await fetchImpl('/.netlify/functions/nvidia-proxy', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ apiKey, model, prompt }), cache: 'no-store', credentials: 'omit', signal: controller.signal,
      })
    } catch {
      if (controller.signal.aborted) {
        const seconds = Math.max(1, Math.round(timeoutMs / 1000))
        throw new NvidiaChatError(`La requête NVIDIA a dépassé ${seconds} seconde${seconds > 1 ? 's' : ''}. Réessayez.`, 'timeout')
      }
      throw new NvidiaChatError('Connexion au proxy Keydock impossible. Vérifiez le déploiement Netlify et votre réseau.', 'network')
    }
    if (!response.ok) throw errorForStatus(response.status)
    let payload: NvidiaChatCompletionResponse
    try { payload = await response.json() as NvidiaChatCompletionResponse }
    catch { throw new NvidiaChatError('Le proxy NVIDIA a renvoyé une réponse illisible.', 'invalid_response', response.status) }
    const content = payload.choices?.[0]?.message?.content
    const answer = typeof content === 'string' ? content.trim() : Array.isArray(content)
      ? content.filter(part => part.type === 'text' && typeof part.text === 'string').map(part => part.text).join('').trim() : ''
    if (!answer) throw new NvidiaChatError('La réponse NVIDIA ne contient aucun texte exploitable.', 'invalid_response', response.status)
    return answer
  } finally { clearTimeout(timeout) }
}
