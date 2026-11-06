import type { ModelDefinition } from '../types'

/** Alpha.1.1 keeps the catalog empty until model access is independently verified. Each future model owns an accessPolicyId. */
export const models: ModelDefinition[] = []

export function modelsForProvider(providerId: ModelDefinition['providerId']) {
  return models.filter((model) => model.providerId === providerId)
}
