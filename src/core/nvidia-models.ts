import type { ModelDefinition } from '../types'

/** Model ID is listed in NVIDIA's hosted NIM API catalog; pricing, quota and account access remain unverified. */
export const nvidiaModels: ModelDefinition[] = [
  {
    id: 'meta/llama-3.1-8b-instruct',
    providerId: 'nvidia',
    label: 'Llama 3.1 8B Instruct',
    capabilities: ['text'],
    accessPolicyId: 'unknown-unverified',
  },
]
