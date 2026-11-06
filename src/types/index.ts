export type ProviderId = 'openrouter' | 'groq' | 'github' | 'nvidia'

export type ChatRole = 'assistant' | 'user'

export type Provider = {
  id: ProviderId
  name: string
  shortName: string
  family: string
  description: string
  endpoint: string
  accent: string
  badge: string
}

export type ModelCapability = 'text' | 'vision' | 'tools' | 'structured-output'

export type ModelDefinition = {
  id: string
  providerId: ProviderId
  label: string
  capabilities: ModelCapability[]
  accessPolicyId: string
}

export type AccessPolicy = {
  id: string
  pricing: 'free' | 'paid' | 'variable' | 'unknown'
  label: string
  quotaLabel: string
  sourceUrl?: string
  scope?: string
  lastVerifiedAt?: string
}

export type ChatMessage = {
  id: number
  role: ChatRole
  text: string
  meta?: string
}
