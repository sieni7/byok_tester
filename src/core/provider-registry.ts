import type { Provider } from '../types'

/** Provider metadata only. Pricing and quota live on model access policies. */
export const providers: Provider[] = [
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    shortName: 'NV',
    family: 'Inference hébergée NVIDIA',
    description: 'Fournisseur principal de l’alpha.3 : premier endpoint NIM connecté pour des requêtes texte réelles.',
    endpoint: 'integrate.api.nvidia.com/v1',
    accent: 'blue',
    badge: 'Actif · alpha.3',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    shortName: 'OR',
    family: 'Routeur multi-modèles',
    description: 'Intégration prévue après validation du premier parcours NVIDIA NIM.',
    endpoint: 'openrouter.ai/api/v1',
    accent: 'lime',
    badge: 'À venir',
  },
  {
    id: 'groq',
    name: 'Groq',
    shortName: 'G',
    family: 'Inference ultra-rapide',
    description: 'Intégration prévue dans une prochaine étape de la roadmap.',
    endpoint: 'api.groq.com/openai/v1',
    accent: 'orange',
    badge: 'À venir',
  },
  {
    id: 'github',
    name: 'GitHub Models',
    shortName: 'GH',
    family: 'Écosystème GitHub',
    description: 'Intégration prévue dans une prochaine étape de la roadmap.',
    endpoint: 'models.inference.ai.azure.com',
    accent: 'blue',
    badge: 'À venir',
  },
]

export const providerById = new Map(providers.map((provider) => [provider.id, provider]))
