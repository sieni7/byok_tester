import type { Provider } from '../types'

/** Provider metadata only. Pricing and quota live on model access policies. */
export const providers: Provider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    shortName: 'OR',
    family: 'Routeur multi-modèles',
    description: 'Un point d’entrée OpenAI-compatible pour tester une grande variété de modèles.',
    endpoint: 'openrouter.ai/api/v1',
    accent: 'lime',
    badge: 'Recommandé',
  },
  {
    id: 'groq',
    name: 'Groq',
    shortName: 'G',
    family: 'Inference ultra-rapide',
    description: 'La roue de secours quand la vélocité et le volume passent en premier.',
    endpoint: 'api.groq.com/openai/v1',
    accent: 'orange',
    badge: 'Rapide',
  },
  {
    id: 'github',
    name: 'GitHub Models',
    shortName: 'GH',
    family: 'Écosystème GitHub',
    description: 'L’option sans friction pour démarrer avec votre compte GitHub existant.',
    endpoint: 'models.inference.ai.azure.com',
    accent: 'blue',
    badge: 'Sans friction',
  },
]

export const providerById = new Map(providers.map((provider) => [provider.id, provider]))
