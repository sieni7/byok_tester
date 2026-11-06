import type { ModelDefinition } from '../types'

/** Metadata placeholder for alpha.1; populated only after NVIDIA access is verified. */
export const nvidiaModels: ModelDefinition[] = [
  {
    id: 'meta/llama-3.1-8b-instruct',
    providerId: 'nvidia',
    label: 'Llama 3.1 8B Instruct',
    capabilities: ['text'],
    accessPolicyId: 'unknown-unverified',
  },
]
