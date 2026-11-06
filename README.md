# Keydock

> **BYOK control room for modern AI workflows.**
>
> Un cockpit local pour préparer, gérer et tester plusieurs fournisseurs IA depuis un espace unique.

Keydock est une interface React + TypeScript pour prototypes et expérimentations multi-provider. Le dashboard réunit un playground de démonstration et un gestionnaire de credentials.

> **Statut : v0.2.0-alpha.3 — première intégration NVIDIA NIM.** Le playground peut envoyer une requête texte ponctuelle à NVIDIA NIM avec le modèle `meta/llama-3.1-8b-instruct`. Les autres fournisseurs conservent leurs réponses de démonstration ; le chat multi-tour, le streaming et les pièces jointes ne sont pas encore intégrés.

## Périmètre actuel

| Domaine | État |
| --- | --- |
| Playground | Appel texte réel NVIDIA NIM ; réponses simulées pour les autres fournisseurs |
| Gestion des clés | Ajout, modification, suppression, copie et affichage masqué |
| Providers | OpenRouter, Groq, GitHub Models et NVIDIA NIM dans le registre |
| Politiques d'accès | Rattachées aux modèles ; inconnues tant qu'elles ne sont pas vérifiées |
| Stockage | Session volatile par défaut ; persistance navigateur facultative avec retour d'état |
| Apparence | Thèmes clair et sombre ; choix manuel temporaire, initialisé selon le système |
| Déploiement | SPA statique, build Vite et configuration Netlify |

Le microphone reste un élément de prototype sans transcription. Les pièces jointes ne sont pas prises en charge par l'intégration NVIDIA de cette alpha.

## Providers de départ

- **OpenRouter** — endpoint compatible OpenAI : `openrouter.ai/api/v1`.
- **Groq** — endpoint compatible OpenAI : `api.groq.com/openai/v1`.
- **GitHub Models** — endpoint : `models.inference.ai.azure.com`.
- **NVIDIA NIM** — endpoint : `https://integrate.api.nvidia.com/v1/chat/completions` ; modèle initial : `meta/llama-3.1-8b-instruct`.

La gratuité, les quotas et les tarifs sont propres à chaque modèle et peuvent dépendre du compte et de la date. Keydock ne doit jamais présenter un fournisseur entier comme gratuit sans preuve vérifiée.

## Gestion des credentials et sécurité

### Mode session — défaut

- Les clés restent dans l'état mémoire de l'application.
- Au démarrage, Keydock ne lit pas `localStorage`.
- Le service de credentials ne sonde, ne lit et n'écrit aucun stockage persistant en mode session.
- Les clés en mémoire disparaissent au rechargement ou à la fermeture de l'onglet.

### Mode stockage local — opt-in

L'utilisateur peut sélectionner explicitement le stockage local du navigateur. Les credentials sont alors enregistrés dans `localStorage`.

**Avertissement :** `localStorage` n'est pas un coffre sécurisé ni un stockage chiffré. Toute personne ayant accès au profil du navigateur peut potentiellement lire les valeurs. Ce mode est réservé au prototype local et ne constitue pas une architecture de production.

Aucune clé réelle ne doit être ajoutée au dépôt, aux exemples, aux captures d'écran ou aux logs. Avant toute mise en production, les appels fournisseurs directs depuis le navigateur devront être réévalués : ils exposent nécessairement la clé au contexte client. Prévoir un proxy serveur/vault avec contrôle d'accès, rotation, journalisation expurgée et limites de débit.

## NVIDIA NIM — alpha.3

La première intégration utilise l'API Chat Completions compatible OpenAI de NVIDIA NIM. Keydock envoie une requête texte non-streamée pour le prompt courant ; l'historique antérieur n'est pas transmis. Les erreurs d'authentification, d'autorisation, de quota, de serveur, de réseau et de délai sont distinguées. La disponibilité, les quotas et les conditions d'accès du modèle ne sont pas présumés : la politique reste `unknown-unverified`.

**Confidentialité :** le prompt et la clé API sont envoyés directement depuis le navigateur vers `integrate.api.nvidia.com`. NVIDIA reçoit le contenu du prompt. Le navigateur et ses outils de développement peuvent exposer la clé pendant l'utilisation. Le mode session reste recommandé ; `localStorage` n'est pas chiffré. Cette intégration est un prototype BYOK et ne remplace pas un proxy serveur/vault pour une mise en production.

## Apparence

Keydock propose un thème clair et un thème sombre. Le thème initial suit la préférence système du navigateur ; le basculement manuel reste actif pendant la session courante et ne nécessite aucun stockage persistant.

## Architecture du dépôt

```text
src/
├── app/
│   └── App.tsx
├── components/
├── core/
│   ├── provider-registry.ts
│   ├── model-registry.ts
│   └── access-policy.ts
├── services/
│   └── credential-service.ts
├── types/
│   └── index.ts
└── main.tsx
scripts/
├── test-credentials.mjs
├── test-nvidia.mjs
└── verify-alpha1.mjs
public/
netlify.toml
package.json
package-lock.json
TODO.md
```

## Prérequis et démarrage

Node.js **20.19+** ou **22.12+** (voir `.nvmrc`) et npm.

```bash
npm install
npm run dev
```

Build et contrôles :

```bash
npm run build
npm run test:credentials
npm run test:nvidia
npm run verify:alpha1
git diff --check
```

Le build Vite est généré dans `dist/`.

## Roadmap

1. **alpha.1.2** — mode session par défaut, tests comportementaux du service de credentials, scanner récursif de secrets et documentation alignée.
2. **alpha.2** — choix session/local explicite, conséquences expliquées et mode actif accessible (fusionné).
3. **alpha.3** — premier appel texte réel NVIDIA NIM, avec gestion des erreurs et avertissement sur l'envoi direct depuis le navigateur.
4. **beta.1** — chat réel et normalisation des erreurs.
5. **beta.2** — catalogue de modèles et autres providers.
6. **rc.1** — comparateur multi-modèles et validation complète.
7. **v0.2.0** — publication stable après validation humaine.

## Principes de contribution

- Aucun secret dans le code ou l'historique Git.
- Pas de fausse indication de disponibilité, de gratuité ou de quota.
- Pas d'appel réseau présenté comme fonctionnel s'il est simulé.
- Préserver une architecture progressive et vérifiable.
- Toute intégration réelle doit être testée et auditée avant activation.

## Licence

À définir avec les mainteneurs du dépôt `sieni7/byok_tester` avant ouverture publique.
