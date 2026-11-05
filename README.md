# Keydock

Keydock est un dashboard BYOK en React + TypeScript pour organiser des clés de fournisseurs LLM et préparer des conversations depuis un même espace. Le prototype est frontend-only : aucune clé n’est incluse dans le dépôt et les valeurs saisies sont conservées uniquement dans le `localStorage` du navigateur.

## Développement

```bash
npm install
npm run dev
```

## Build Netlify

Le site est une SPA statique. Utilisez `npm run build` comme commande de build et `dist` comme dossier de publication. Le fichier `netlify.toml` reprend ces valeurs et redirige les routes vers `index.html`.

## Sécurité BYOK

Les clés saisies dans Keydock ne sont pas envoyées à une base de données ni à un service tiers par cette interface. Avant une mise en production avec appels directs à des fournisseurs, ajoutez une politique CSP stricte, chiffrez ou isolez les secrets selon le modèle de menace choisi et ne publiez jamais de `.env` contenant une clé privée.
