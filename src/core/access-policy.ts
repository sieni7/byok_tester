import type { AccessPolicy } from '../types'

/**
 * Policies apply to model definitions, not providers. Unknown is intentional
 * until a specific model, scope and current source have been verified.
 */
export const accessPolicies: AccessPolicy[] = [
  {
    id: 'unknown-unverified',
    pricing: 'unknown',
    label: 'Access conditions not verified',
    quotaLabel: 'Unknown — verify the model source',
    scope: 'Specific model and account tier required',
  },
]

export const accessPolicyById = new Map(accessPolicies.map((policy) => [policy.id, policy]))
