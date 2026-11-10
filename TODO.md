# TODO — Keydock

## Keydock v0.2 — Free Models Lab
- [x] `v0.2.0-alpha.1` : les dépendances sont verrouillées, les types communs et registres providers/modèles/policies sont en place, et l’application est découpée autour de `src/app/App.tsx` sans régression visuelle constatée.
- [x] `v0.2.0-alpha.1.1 corrective` : l’interface est générée par le registre, les politiques sont inconnues par défaut et rattachées aux modèles, les modes session/local sont distincts, le stockage indisponible ne fait pas crasher l’application, Node est documenté, et les contrôles indépendants, le build et le Preview passent.
- [x] `v0.2.0-alpha.1.2 corrective` : le mode session est le mode initial sans résolution de localStorage, les tests comportementaux exercent le service réel, le scan de secrets est récursif sans auto-détection, le README est cohérent, et la revue indépendante passe.
- [ ] `v0.2.0-alpha.2` : étendre l’UX credentials et préparer les invariants nécessaires aux premiers appels fournisseurs.
- [ ] `v0.2.0-alpha.3` : connecter NVIDIA NIM pour un premier appel texte réel.
- [ ] `v0.2.0-beta.1` : remplacer les réponses de démonstration par un chat réel et normaliser les erreurs.
- [ ] `v0.2.0-beta.2` : ajouter les autres providers et le catalogue de modèles.
- [ ] `v0.2.0-rc.1` : livrer le comparateur multi-modèles et la validation complète.
- [ ] `v0.2.0` : publier la version stable après validation humaine.

## Dashboard responsive et architecture statique
- [x] Le projet TypeScript React fournit un dashboard responsive à deux zones : fenêtre de chat à gauche et panneau de gestion des clés API à droite, avec adaptation mobile soignée.
- [x] Le projet est prêt pour un dépôt GitHub public et une publication statique sur Netlify, avec configuration de build et documentation de déploiement adaptées. La configuration Netlify est livrée et le dépôt public `sieni7/byok_tester` contient la base v0.1.

## Chat BYOK
- [x] L’interface de chat permet la saisie des messages et conserve un historique de conversation dans la session.
- [x] L’interface expose des commandes pour joindre des fichiers et utiliser le microphone.
- [x] Un sélecteur permet de basculer simplement entre OpenRouter, Groq et GitHub Models configurés.

## Fournisseurs et gestion des clés
- [x] OpenRouter est mis en avant comme choix polyvalent avec endpoint compatible SDK OpenAI, sans présenter une gratuité ou un quota au niveau du fournisseur.
- [x] Groq est présenté comme solution de secours rapide, sans présenter une gratuité ou un quota au niveau du fournisseur.
- [x] GitHub Models est présenté comme alternative sans friction liée au compte GitHub, avec indication de limites plus restrictives.
- [x] Chaque clé API peut être ajoutée, modifiée, révélée ou masquée, copiée et supprimée, avec libellés clairs et regroupement par famille de fournisseurs.
- [x] Des indicateurs visuels distinguent les fournisseurs configurés, non configurés et actuellement actifs.
- [x] Les clés sont conservées exclusivement localement dans le navigateur, sans clé codée en dur, sans envoi vers un service de stockage tiers et sans exposition involontaire dans l’interface.
