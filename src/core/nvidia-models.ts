import type { ModelDefinition } from '../types'

/** Listed in NVIDIA's hosted NIM catalog; account entitlement and runtime availability still require a real request. */
export const nvidiaModels: ModelDefinition[] = [
  {
    id: 'meta/llama-3.3-70b-instruct',
    providerId: 'nvidia',
    label: 'Llama 3.3 70B Instruct',
    capabilities: ['text'],
    accessPolicyId: 'unknown-unverified',
  },
]
