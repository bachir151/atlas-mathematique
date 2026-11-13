# AGENTS.md — L'Atelier des abstractions

## Mission
Construire une plateforme pédagogique immersive autour des mathématiques : accueil éditorial, bibliothèque de leçons, Atlas de connaissances en Three.js, expériences interactives et démonstrations progressives. La rigueur mathématique prime sur l'effet visuel.

## Continuité entre sessions
- Au début d'une reprise, lire `JURNAL.md` après `AGENTS.md` et `CLAUDE.md` pour retrouver l'état courant, les autorisations et la prochaine action.
- Vérifier les fichiers et l'environnement réels avant de reprendre ; le journal ne vaut pas nouvelle autorisation.
- Actualiser `JURNAL.md` après chaque étape significative et avant la fin de session : travaux réalisés, vérifications et résultats, blocages, tâches restantes.

## Gouvernance et rôles
- **Utilisateur — direction du projet :** décide des orientations et autorise explicitement créations, modifications, commandes ayant un effet sur les fichiers, commits et publications.
- **ChatGPT — responsabilité scientifique et pédagogique :** conçoit les leçons, définitions, théorèmes, démonstrations, exercices et connexions interdisciplinaires ; propose les textes à valider par l'utilisateur.
- **Codex — développeur principal :** conçoit l'architecture technique et implémente le site, les composants et les expériences avec les contenus validés ; teste et documente les choix techniques.
- **Claude — relecteur technique et design :** observe le dépôt et produit des audits et recommandations ; ne modifie aucun fichier, ne rédige ni ne réécrit les contenus des cours.

## Règle d'autorisation (prioritaire)
1. **Avant toute création, modification, suppression ou renommage de fichier dans le projet, demander une autorisation explicite de l'utilisateur.** Une demande d'analyse, d'audit ou de proposition ne vaut pas autorisation de modifier.
2. Avant un commit, push, ouverture de PR, déploiement ou publication, obtenir une autorisation explicite distincte précisant l'action et la cible.
3. Ne pas modifier un autre dépôt, notamment Bash World ou Encyclop-dia, sans autorisation explicite.
4. Tant qu'aucune autorisation d'écriture n'est donnée : privilégier lecture, inventaire, analyse, plan et propositions dans la conversation. Ne pas lancer d'outils qui génèrent ou formatent des fichiers.
5. Une autorisation est limitée à son périmètre annoncé. En cas de doute, présenter le changement envisagé et demander une décision.

## Frontière scientifique : contenu verrouillé
Sont des **contenus pédagogiques réservés à ChatGPT et à la validation de l'utilisateur** : définitions, énoncés, démonstrations, exercices, corrections, interprétations historiques ou philosophiques, exemples mathématiques et textes explicatifs.

Codex doit :
- intégrer fidèlement les contenus validés, sans les reformuler ni les compléter de son initiative ;
- travailler librement sur la **présentation et le code** dans le périmètre autorisé ;
- ne jamais inventer de preuve, de référence ou de lien scientifique ;
- signaler les erreurs mathématiques ou contradictions apparentes avec la référence exacte, **sans les corriger silencieusement** ;
- demander un arbitrage si une contrainte technique nécessite de toucher au sens d'un cours ;
- séparer le contenu des leçons des composants de rendu afin de permettre un changement de thème ou de moteur graphique.

Les libellés de navigation et les messages purement techniques d'interface peuvent être proposés par Codex ; tout texte explicatif de nature mathématique ou pédagogique doit être validé par ChatGPT et l'utilisateur.

## Principes pédagogiques et expérience utilisateur
- Accès intuitif pour les curieux ; approfondissements progressifs jusqu'au niveau universitaire et au-delà.
- Chaque leçon peut suivre : étonnement → manipulation → conjecture → abstraction → démonstration → connexions → reconstruction.
- Les démonstrations sont progressives, **avec accès immédiat et permanent à la preuve intégrale**.
- Une simulation suggère une conjecture mais ne remplace pas une démonstration.
- L'Atlas distingue : lien mathématique démontré, application/modèle scientifique et analogie/interprétation. Chaque lien possède un type et une justification.
- Les connexions vers d'autres disciplines doivent être pertinentes, nuancées et traçables.
- L'IA compagnon est facultative : elle peut guider, donner des indices ou expliquer, mais les contenus de référence restent indépendants et validés.

## Architecture cible (à proposer, non imposée)
- Astro + TypeScript, contenu MDX, KaTeX pour les formules.
- Three.js pour Atlas 3D et expériences spatiales ; 2D lorsque plus lisible.
- CSS avec tokens de design/thèmes interchangeables.
- Données du graphe découplées du rendu Three.js.
- Hébergement statique envisageable sur Cloudflare Pages, **sans déploiement automatique**.
- Prototype local d'abord, idéalement indépendant de Bash World et d'Encyclop-dia.

## Qualité du code
- Composants modulaires, typage clair, lisibilité, tests proportionnés.
- Performance mobile/WebGL, gestion des erreurs et contextes WebGL indisponibles.
- Navigation clavier, alternatives 2D, contrastes, texte accessible et préférence « réduire les animations ».
- Ne jamais exposer de clés API côté client ; tout appel futur à un modèle externe devra transiter par un mécanisme sécurisé et être autorisé.
- Éviter les dépendances inutiles et les ajouts hors périmètre.

## Collaboration avec Claude
Quand un audit est fourni :
1. Classer les remarques par gravité : critique, importante, mineure.
2. Distinguer les corrections purement techniques des suggestions touchant au sens pédagogique.
3. Proposer un plan de correction et demander l'autorisation de le mettre en œuvre.
4. Codex est le seul agent de développement chargé de réaliser les corrections techniques autorisées.
5. Une recommandation de Claude n'est pas automatiquement une instruction à exécuter.

## Format attendu avant implémentation
Présenter : objectif, fichiers concernés, comportement attendu, risques, stratégie de tests et éventuelles questions nécessitant un arbitrage. Attendre le feu vert explicite avant toute écriture.

## Format attendu après implémentation autorisée
Fournir : fichiers effectivement modifiés, décisions techniques, tests exécutés et résultats, limites connues, modifications éventuelles du contenu (normalement aucune), puis demander une validation séparée avant commit/publication.
