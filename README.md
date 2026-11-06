# Keydock

> **BYOK control room for modern AI workflows.**
>
> Un cockpit local pour connecter, comparer et préparer des appels vers plusieurs fournisseurs IA sans disperser ses clés API.

Keydock est une interface React + TypeScript pensée pour les prototypes, les équipes produit et les développeurs qui veulent tester rapidement plusieurs providers LLM depuis un même espace. Le dashboard réunit un playground conversationnel à gauche et un gestionnaire de credentials à droite, dans une interface claire, dense et responsive.

> **Statut : v0.2.0-alpha.1.1 corrective — fondations validées** — l’interface est pilotée par le registre, les politiques d’accès sont rattachées aux modèles, et les modes session/local sont explicitement séparés. Aucun provider réel n’est encore appelé.

## Ce que le prototype couvre

| Domaine | Fonctionnalités |
| --- | --- |
| **Playground** | Conversation en session, sélection du provider actif, pièces jointes locales, commande microphone et réponses de démonstration. |
| **API key manager** | Ajout, modification, suppression, copie, masquage/révélation et statut de chaque clé. |
| **Providers** | OpenRouter en choix recommandé, Groq en fallback haute vitesse, GitHub Models comme option sans friction. |
| **Sécurité locale** | Aucune clé codée en dur, aucune base de données, aucun envoi tiers effectué par cette interface. |
| **Déploiement** | SPA statique, build Vite, configuration Netlify prête à l’emploi et manifest de routes Manus. |

## Providers de départ

### OpenRouter — choix recommandé
Un endpoint compatible OpenAI pour changer de modèle sans réécrire l’intégration. Keydock le présente comme le meilleur point d’entrée pour expérimenter rapidement avec plusieurs familles de modèles.

- Endpoint de référence : `openrouter.ai/api/v1`
- Accès : politique au niveau du modèle ; tarif et quota restent `unknown` tant qu’un modèle, un compte et une source datée n’ont pas été vérifiés
- Usage conseillé : prototypage polyvalent, comparaison de modèles, itération produit

### Groq — fallback haute vitesse
Une option orientée performance lorsque le débit et la latence deviennent prioritaires.

- Endpoint de référence : `api.groq.com/openai/v1`
- Accès : politique au niveau du modèle ; ne pas assimiler le provider entier à une offre gratuite
- Usage conseillé : traitements textuels en volume, benchmarks, boucles de test rapides

### GitHub Models — démarrage sans friction
Une alternative pratique pour les équipes déjà équipées d’un compte GitHub et qui souhaitent expérimenter sans multiplier les comptes fournisseurs.

- Endpoint de référence : `models.inference.ai.azure.com`
- Limites : variables selon le modèle et le niveau de quota
- Usage conseillé : essais ponctuels, projets GitHub-first, découverte de modèles

> Les quotas sont des repères d’interface et peuvent évoluer selon les conditions commerciales de chaque fournisseur. Vérifiez toujours la documentation officielle avant une mise en production.

## Modèle de sécurité actuel

Keydock adopte une posture **local-first** pour ce prototype :

1. Les valeurs saisies sont conservées dans le `localStorage` du navigateur, sous une clé d’application dédiée.
2. Aucune clé privée n’est présente dans le code source, le dépôt ou les fichiers `.env`.
3. L’interface ne transmet pas les credentials à une base de données ou à un service de stockage tiers.
4. Les clés sont masquées par défaut et ne sont copiées que sur action explicite de l’utilisateur.
5. Le playground actuel simule la préparation d’un prompt ; il ne déclenche pas encore d’appel fournisseur en arrière-plan.

**Important :** `localStorage` n’est pas un coffre chiffré. Toute personne disposant d’un accès au profil navigateur peut potentiellement lire ces valeurs. Pour une version de production, remplacer ce stockage par un vault sécurisé ou un backend de proxy avec rotation, contrôle d’accès, audit, rate limiting et séparation stricte des environnements.

## Stack

- **React 19** et **TypeScript**
- **Vite** pour le développement et le bundling
- CSS natif avec design system léger, responsive et sans dépendance UI lourde
- `localStorage` pour la persistance locale du prototype
- Netlify pour la publication statique

## Démarrage local

Prérequis : Node.js 18+ et npm.

```bash
npm install
npm run dev
```

Le serveur de développement écoute sur le port `3000` lorsque le runtime Manus est utilisé. Pour produire un build de vérification :

```bash
npm run build
```

Le résultat est généré dans `dist/`.

## Déploiement Netlify

Le dépôt contient déjà un `netlify.toml` configuré :

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

Dans Netlify, sélectionnez le dépôt GitHub, conservez ces valeurs puis lancez le premier déploiement. La redirection SPA `/* → /index.html` est incluse pour préserver le dashboard sur les routes côté client.

### Checklist avant publication

- Remplacer le stockage `localStorage` par une stratégie de secrets adaptée au modèle de menace.
- Ajouter une Content Security Policy et vérifier les domaines autorisés pour les polices et futures API.
- Ne jamais ajouter de clé réelle dans le dépôt, les logs, les screenshots ou les variables publiques du frontend.
- Brancher les appels fournisseurs via un proxy serveur si les clés ne doivent pas être exposées au navigateur.
- Vérifier les conditions, quotas et politiques de rétention propres à chaque provider.

## Structure du projet

```text
.
├── src/
│   ├── main.tsx          # application React, état local et interactions
│   └── styles.css        # design system et responsive layout
├── public/
│   └── manus-routes.json # routes déclarées au runtime
├── netlify.toml          # build et fallback SPA Netlify
├── app.config.ts         # métadonnées du projet
└── TODO.md               # état des objectifs produit
```

## Roadmap proposée

La série v0.2 est livrée par étapes : `alpha.1` socle initial, `alpha.1.1` corrective et fondations validées, `alpha.2` extension du credential UX, `alpha.3` premier appel NVIDIA NIM, `beta.1` chat réel et erreurs normalisées, `beta.2` catalogue multi-provider, `rc.1` comparateur et validation, puis `v0.2.0` stable.

- Connecter le chat à un proxy sécurisé et à des modèles réels.
- Ajouter un coffre chiffré, la rotation et la révocation des credentials.
- Ajouter un historique de requêtes opt-in avec redaction des secrets.
- Ajouter la sélection de modèles par provider et un comparateur de latence/coût.
- Ajouter des tests de composants et une CI de build sur le dépôt GitHub.

## Contribution

Les contributions doivent préserver les principes suivants : pas de secrets dans le code, pas de télémétrie implicite sur les prompts, composants lisibles, interactions clavier accessibles et dégradation propre sur mobile.

## Licence

À définir avec les mainteneurs du dépôt `sieni7/byok_tester` avant ouverture publique.
