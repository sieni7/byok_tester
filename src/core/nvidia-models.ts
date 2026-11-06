import type { ModelDefinition } from '../types'

/** NVIDIA currently marks the free hosted endpoint as available; account-level access still requires a real request. */
export const nvidiaModels: ModelDefinition[] = [
  {
    id: 'openai/gpt-oss-20b',
    providerId: 'nvidia',
    label: 'GPT-OSS 20B',
    capabilities: ['text'],
    accessPolicyId: 'unknown-unverified',
  },
]
