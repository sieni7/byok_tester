# TODO — Keydock

## Dashboard responsive et architecture statique
- [ ] Le projet TypeScript React fournit un dashboard responsive à deux zones : fenêtre de chat à gauche et panneau de gestion des clés API à droite, avec adaptation mobile soignée.
- [ ] Le projet est prêt pour un dépôt GitHub public et une publication statique sur Netlify, avec configuration de build et documentation de déploiement adaptées.

## Chat BYOK
- [ ] L’interface de chat permet la saisie des messages et conserve un historique de conversation dans la session.
- [ ] L’interface expose des commandes pour joindre des fichiers et utiliser le microphone.
- [ ] Un sélecteur permet de basculer simplement entre OpenRouter, Groq et GitHub Models configurés.

## Fournisseurs et gestion des clés
- [ ] OpenRouter est mis en avant comme choix polyvalent, avec endpoint compatible SDK OpenAI, accès à de nombreux modèles gratuits et limites indicatives de 20 requêtes par minute et 50 par jour.
- [ ] Groq est présenté comme solution de secours rapide et généreuse, avec limites indicatives d’environ 30 requêtes par minute et 1 000 par jour.
- [ ] GitHub Models est présenté comme alternative sans friction liée au compte GitHub, avec indication de limites plus restrictives.
- [ ] Chaque clé API peut être ajoutée, modifiée, révélée ou masquée, copiée et supprimée, avec libellés clairs et regroupement par famille de fournisseurs.
- [ ] Des indicateurs visuels distinguent les fournisseurs configurés, non configurés et actuellement actifs.
- [ ] Les clés sont conservées exclusivement localement dans le navigateur, sans clé codée en dur, sans envoi vers un service de stockage tiers et sans exposition involontaire dans l’interface.
