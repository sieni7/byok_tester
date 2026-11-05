import type { ProviderId } from '../types'

export type CredentialStorageMode = 'local' | 'session'

export const CREDENTIAL_STORAGE_KEY = 'keydock-api-keys-v1'

export function emptyCredentials(): Record<ProviderId, string> {
  return { openrouter: '', groq: '', github: '', nvidia: '' }
}

export function loadCredentials(storage: Storage = localStorage): Record<ProviderId, string> {
  const empty = emptyCredentials()
  try {
    const saved = JSON.parse(storage.getItem(CREDENTIAL_STORAGE_KEY) ?? '{}') as Partial<Record<ProviderId, string>>
    return { ...empty, ...saved }
  } catch {
    return empty
  }
}

export function saveCredentials(credentials: Record<ProviderId, string>, storage: Storage = localStorage): void {
  storage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(credentials))
}
