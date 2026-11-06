# TODO — Keydock

## Keydock v0.2 — Free Models Lab

- [x] `v0.2.0-alpha.1` : socle React/TypeScript, dépendances verrouillées, types communs et registres.
- [x] `v0.2.0-alpha.1.1 corrective` : UI pilotée par le registre, politiques d'accès au niveau modèle, séparation initiale session/local.
- [ ] `v0.2.0-alpha.1.2 corrective` (implémentation poussée, validation indépendante en attente) : mode session par défaut sans lecture/écriture de stockage persistant ; tests comportementaux instrumentés ; scanner récursif des sources ; README et TODO alignés.
- [ ] Validation indépendante alpha.1.2 : `npm run test:credentials`, `npm run verify:alpha1`, `npm run build`, `git diff --check`, revue du diff et du Preview.
- [ ] `v0.2.0-alpha.2` : stabiliser l'UX credentials et les états de stockage après validation alpha.1.2.
- [ ] `v0.2.0-alpha.3` : intégrer NVIDIA NIM pour un premier appel texte réel, uniquement après validation du socle.
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
- [ ] Remplacer les réponses de démonstration par des appels réels après mise en place d'une architecture de credentials adaptée.
- [ ] Implémenter réellement la lecture des fichiers et la capture microphone, ou conserver des libellés explicitement démonstratifs.

## Credentials

- [x] Ajout, modification, suppression, copie et masquage/révélation des clés.
- [x] Mode session volatil par défaut : aucun accès à localStorage au démarrage.
- [x] Mode local facultatif avec avertissement explicite sur l'absence de chiffrement.
- [x] Tests runtime vérifiant l'absence d'accès au stockage en mode session, le chargement/sauvegarde locale et le fallback sur stockage indisponible.
- [ ] Étudier un proxy/vault serveur avant toute exposition publique des appels fournisseurs.
