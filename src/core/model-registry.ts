import type { ModelDefinition } from '../types'

/**
 * Alpha.1 intentionally starts with metadata only. Adapters will consume this
 * registry in later deliveries without changing the playground contract.
 */
export const models: ModelDefinition[] = []

export function modelsForProvider(providerId: ModelDefinition['providerId']) {
  return models.filter((model) => model.providerId === providerId)
}
