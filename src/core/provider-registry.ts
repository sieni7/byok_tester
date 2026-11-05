import type { Provider } from '../types'

export const providers: Provider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    shortName: 'OR',
    family: 'Routeur multi-modèles',
    description: 'Un point d’entrée OpenAI-compatible pour tester une grande variété de modèles.',
    metric: '20 / min',
    metricLabel: 'limite indicative',
    endpoint: 'openrouter.ai/api/v1',
    accent: 'lime',
    badge: 'Recommandé',
    accessPolicyId: 'openrouter-free-models',
  },
  {
    id: 'groq',
    name: 'Groq',
    shortName: 'G',
    family: 'Inference ultra-rapide',
    description: 'La roue de secours quand la vélocité et le volume passent en premier.',
    metric: '1 000 / jour',
    metricLabel: 'limite indicative',
    endpoint: 'api.groq.com/openai/v1',
    accent: 'orange',
    badge: 'Rapide',
    accessPolicyId: 'groq-free-tier',
  },
  {
    id: 'github',
    name: 'GitHub Models',
    shortName: 'GH',
    family: 'Écosystème GitHub',
    description: 'L’option sans friction pour démarrer avec votre compte GitHub existant.',
    metric: '15 / min',
    metricLabel: 'selon le modèle',
    endpoint: 'models.inference.ai.azure.com',
    accent: 'blue',
    badge: 'Sans friction',
    accessPolicyId: 'github-models-variable',
  },
]

export const providerById = new Map(providers.map((provider) => [provider.id, provider]))
