import type { AccessPolicy } from '../types'

/**
 * Quotas are display metadata, never a contract. Each entry carries a source
 * and verification date so stale or uncertain claims stay visible as such.
 */
export const accessPolicies: AccessPolicy[] = [
  {
    id: 'openrouter-free-models',
    pricing: 'free',
    label: 'Free models — verify current quota',
    quotaLabel: '20/min · 50/day indicative',
    sourceUrl: 'https://openrouter.ai/docs/api_reference/limits',
    lastVerifiedAt: '2026-11-05',
  },
  {
    id: 'groq-free-tier',
    pricing: 'free',
    label: 'Free tier — model dependent',
    quotaLabel: 'Provider quota varies',
    sourceUrl: 'https://console.groq.com/docs/rate-limits',
    lastVerifiedAt: '2026-11-05',
  },
  {
    id: 'github-models-variable',
    pricing: 'variable',
    label: 'GitHub Models — account and model dependent',
    quotaLabel: 'Verify in GitHub Models',
    sourceUrl: 'https://docs.github.com/en/github-models',
    lastVerifiedAt: '2026-11-05',
  },
]

export const accessPolicyById = new Map(accessPolicies.map((policy) => [policy.id, policy]))
