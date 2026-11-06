# Keydock

> **BYOK control room for modern AI workflows.**
>
> Un cockpit local pour préparer, gérer et tester plusieurs fournisseurs IA depuis un espace unique.

Keydock est une interface React + TypeScript pour prototypes et expérimentations multi-provider. Le dashboard réunit un playground de démonstration et un gestionnaire de credentials.

> **Statut : v0.2.0-alpha.2 — UX des modes credentials en cours de validation.** Le mode session est le choix recommandé et le comportement par défaut. Deux choix explicites sont présentés : session volatile ou stockage local du navigateur, avec leurs conséquences expliquées avant utilisation. Aucun appel réel à un fournisseur IA n'est encore effectué ; NVIDIA NIM n'est pas intégré.

## Périmètre actuel

| Domaine | État |
| --- | --- |
| Playground | Saisie et historique en mémoire ; réponses simulées, sans appel réseau |
| Gestion des clés | Ajout, modification, suppression, copie et affichage masqué |
| Providers | OpenRouter, Groq et GitHub Models dans le registre |
| Politiques d'accès | Rattachées aux modèles ; inconnues tant qu'elles ne sont pas vérifiées |
| Stockage | Session volatile par défaut ; persistance navigateur facultative avec retour d'état |
| Apparence | Thèmes clair et sombre ; choix manuel temporaire, initialisé selon le système |
| Déploiement | SPA statique, build Vite et configuration Netlify |

Les commandes microphone et pièce jointe sont des éléments d'interface de prototype : le microphone ne réalise pas de transcription et la pièce jointe ne transmet ni n'analyse le contenu du fichier.

## Providers de départ

- **OpenRouter** — endpoint compatible OpenAI : `openrouter.ai/api/v1`.
- **Groq** — endpoint compatible OpenAI : `api.groq.com/openai/v1`.
- **GitHub Models** — endpoint : `models.inference.ai.azure.com`.

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
npm run verify:alpha1
git diff --check
```

Le build Vite est généré dans `dist/`.

## Roadmap

1. **alpha.1.2** — mode session par défaut, tests comportementaux du service de credentials, scanner récursif de secrets et documentation alignée.
2. **alpha.2** — choix session/local présenté sous forme de deux options explicites, explication des conséquences, état de session et retour de sauvegarde locale.
3. **alpha.3** — première intégration réelle NVIDIA NIM, seulement après validation des fondations.
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
