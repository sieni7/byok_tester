import type { ProviderId } from '../types'

export type CredentialStorageMode = 'local' | 'session'

export const CREDENTIAL_STORAGE_KEY = 'keydock-api-keys-v1'

export function emptyCredentials(): Record<ProviderId, string> {
  return { openrouter: '', groq: '', github: '', nvidia: '' }
}

function canUseStorage(storage: Storage): boolean {
  try {
    const probeKey = `${CREDENTIAL_STORAGE_KEY}:probe`
    storage.setItem(probeKey, 'ok')
    storage.removeItem(probeKey)
    return true
  } catch {
    return false
  }
}

function getDefaultLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' || !canUseStorage(localStorage) ? null : localStorage
  } catch {
    return null
  }
}

export function loadCredentials(mode: CredentialStorageMode = 'local', storage?: Storage | null): Record<ProviderId, string> {
  if (mode === 'session') return emptyCredentials()
  const resolvedStorage = storage === undefined ? getDefaultLocalStorage() : storage
  if (!resolvedStorage) return emptyCredentials()
  try {
    const saved = JSON.parse(resolvedStorage.getItem(CREDENTIAL_STORAGE_KEY) ?? '{}') as Partial<Record<ProviderId, string>>
    return { ...emptyCredentials(), ...saved }
  } catch {
    return emptyCredentials()
  }
}

export function saveCredentials(credentials: Record<ProviderId, string>, mode: CredentialStorageMode = 'local', storage?: Storage | null): boolean {
  if (mode === 'session') return false
  const resolvedStorage = storage === undefined ? getDefaultLocalStorage() : storage
  if (!resolvedStorage) return false
  try {
    resolvedStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(credentials))
    return true
  } catch {
    return false
  }
}
