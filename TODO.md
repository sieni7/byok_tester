# TODO — Keydock

## Keydock v0.2 — Free Models Lab

- [x] `v0.2.0-alpha.1` : socle React/TypeScript, dépendances verrouillées, types communs et registres.
- [x] `v0.2.0-alpha.1.1 corrective` : UI pilotée par le registre, politiques d'accès au niveau modèle, séparation initiale session/local.
- [x] `v0.2.0-alpha.1.2 corrective` : mode session par défaut sans accès au stockage persistant ; tests comportementaux ; scanner récursif des sources ; garde-fous de changement de mode ; retours de stockage et presse-papiers ; thème clair/sombre ; CI verte avant fusion.
- [x] Validation CI alpha.1.2 : `npm ci`, `npm run test:credentials`, `npm run verify:alpha1`, `npm run build`, `git diff --check`.
- [x] `v0.2.0-alpha.2` : choix session/local présenté comme deux options lisibles ; conséquences de chaque mode expliquées ; mode actif accessible (`aria-pressed`) ; retour d'état session/local ; confirmation de bascule préservée ; tests structurels et build.
- [ ] `v0.2.0-alpha.3` : premier appel texte réel NVIDIA NIM, gestion des erreurs et tests simulés ; validation réelle avec une clé de test à effectuer.
- [ ] `v0.2.0-beta.1` : remplacer les réponses simulées par un chat réel et normaliser les erreurs.
- [ ] `v0.2.0-beta.2` : compléter les providers et le catalogue de modèles.
- [ ] `v0.2.0-rc.1` : comparateur multi-modèles et validation complète.
- [ ] `v0.2.0` : version stable après validation humaine.

## Dashboard et architecture

- [x] Dashboard responsive à deux zones : playground et gestionnaire de clés.
- [x] Registre des providers séparé des modèles et des politiques d'accès.
- [x] Politique `unknown-unverified` explicite en l'absence de vérification datée.
- [ ] Ajouter des tests UI ciblés sans élargir prématurément l'architecture.

## Playground

- [x] Saisie des messages et historique conservé en mémoire de session.
- [x] Sélecteur de provider actif.
- [ ] Étendre les appels réels aux autres fournisseurs après validation de l'architecture credentials.
- [ ] Ajouter le streaming et l'historique multi-tour après l'alpha.3.
- [ ] Implémenter réellement la lecture des fichiers et la capture microphone, ou conserver des libellés explicitement démonstratifs.

## Credentials

- [x] Ajout, modification, suppression, copie et masquage/révélation des clés.
- [x] Mode session volatil par défaut : aucun accès à localStorage au démarrage.
- [x] Mode local facultatif avec avertissement explicite sur l'absence de chiffrement.
- [x] Choix de mode présenté sous forme de deux cartes accessibles et descriptives ; session recommandée par défaut.
- [x] Confirmation avant basculement susceptible de remplacer les clés visibles en mémoire.
- [x] Retour d'état explicite si l'enregistrement local réussit ou échoue.
- [x] Copie presse-papiers avec gestion des API absentes et des refus d'autorisation.
- [x] Thème clair/sombre, initialisé sur la préférence système et commutable pendant la session.
- [x] Tests runtime vérifiant l'absence d'accès au stockage en mode session, le chargement/sauvegarde locale et le fallback sur stockage indisponible.
- [ ] Étudier un proxy/vault serveur avant toute exposition publique des appels fournisseurs.
- [ ] Vérifier manuellement l'appel NVIDIA réel avec une clé dédiée et confirmer le comportement CORS du navigateur.
