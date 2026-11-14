# AGENTS.md — L'Atelier des abstractions

## Mission
Construire une plateforme pédagogique immersive autour des mathématiques : accueil éditorial, bibliothèque de leçons, Atlas de connaissances en Three.js, expériences interactives et démonstrations progressives. La rigueur mathématique prime sur l'effet visuel.

## Continuité entre sessions
- Au début d'une reprise, lire `JURNAL.md` après `AGENTS.md` et `CLAUDE.md` pour retrouver l'état courant, les autorisations et la prochaine action.
- Vérifier les fichiers et l'environnement réels avant de reprendre ; le journal ne vaut pas nouvelle autorisation.
- Actualiser `JURNAL.md` après chaque étape significative et avant la fin de session : travaux réalisés, vérifications et résultats, blocages, tâches restantes.

## Gouvernance et rôles
- **Utilisateur — direction du projet :** décide des orientations et autorise explicitement créations, modifications, commandes ayant un effet sur les fichiers, commits et publications.
- **Claude — développeur :** conçoit l'architecture technique, écrit et maintient le code, développe les interfaces et les expériences, intègre les contenus fournis par Codex, exécute les tests et corrige les bugs dans le périmètre autorisé.
- **Codex — rédacteur des contenus mathématiques :** conçoit la progression pédagogique et rédige les leçons, définitions, énoncés, démonstrations, exercices, corrections et connexions interdisciplinaires à soumettre à l'utilisateur.

Cette répartition remplace les rôles précédents. Aucun rôle de relecteur, aucun audit ni contre-audit entre agents n'est prévu. Claude développe ; Codex rédige les contenus mathématiques.

## Règle d'autorisation (prioritaire)
1. **Avant toute création, modification, suppression ou renommage de fichier dans le projet, disposer d'une autorisation explicite de l'utilisateur dans le périmètre concerné.** Une demande d'analyse ou de proposition ne vaut pas autorisation de modifier. Ne pas redemander un accord déjà donné pour ce périmètre.
2. Avant un commit, push, ouverture de PR, déploiement ou publication, obtenir une autorisation explicite distincte précisant l'action et la cible.
3. Ne pas modifier un autre dépôt, notamment Bash World ou Encyclop-dia, sans autorisation explicite.
4. Tant qu'aucune autorisation d'écriture n'est donnée : privilégier lecture, inventaire, analyse, plan et propositions dans la conversation. Ne pas lancer d'outils qui génèrent ou formatent des fichiers.
5. Une autorisation est limitée à son périmètre annoncé. En cas de doute, présenter le changement envisagé et demander une décision.

## Contenus mathématiques et intégration
La **rédaction des contenus mathématiques et pédagogiques appartient à Codex** : définitions, énoncés, démonstrations, exercices, corrections, interprétations historiques ou philosophiques, exemples mathématiques et textes explicatifs. L'utilisateur décide de leur validation.

Codex doit :
- rédiger des contenus rigoureux, avec des hypothèses explicites, des démonstrations complètes et des références vérifiables lorsqu'elles sont nécessaires ;
- distinguer les brouillons des contenus validés par l'utilisateur, sans présenter une rédaction nouvelle comme déjà validée ;
- préparer les contenus et les objectifs des expériences pour leur intégration par Claude ;
- signaler toute modification proposée d'un contenu déjà validé avant de la soumettre à l'utilisateur ;
- se consacrer à la rédaction mathématique et pédagogique, sans prendre en charge le développement technique ni la relecture du code.

Claude doit :
- intégrer fidèlement les contenus fournis par Codex et validés par l'utilisateur, sans en modifier le sens ni compléter les passages manquants ;
- utiliser des emplacements provisoires explicites lorsque les contenus manquent ;
- transmettre à Codex toute question mathématique qui bloque l'implémentation ;
- séparer les contenus des composants de rendu ;
- prendre en charge le code, la présentation, les libellés techniques, les tests et les corrections techniques autorisés.

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
- p5.js en mode instance pour les expériences 2D, pavages, fractales, systèmes dynamiques et art génératif ; calculs séparés du rendu, chargement à la demande, pause et destruction propres.
- Expériences mathématiques p5.js soumises à validation pédagogique avant publication, comme les autres contenus scientifiques.
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

## Organisation du travail
- L'utilisateur confie les tâches de développement à Claude et les tâches de rédaction mathématique à Codex.
- Codex fournit les textes et les objectifs pédagogiques ; Claude les intègre après validation de l'utilisateur.
- Les anciens cycles de relecture, d'audit et de contre-audit sont abandonnés. Ne pas lancer l'ancien script d'audit Claude dans ce fonctionnement.
- Les tests techniques font partie du travail de développement de Claude.

## Format attendu avant implémentation
Présenter : objectif, fichiers concernés, comportement attendu, risques, stratégie de tests et éventuelles questions nécessitant un arbitrage. Attendre le feu vert explicite avant toute écriture.

## Format attendu après implémentation autorisée
Claude indique les fichiers modifiés, les décisions techniques, les tests et leurs résultats, ainsi que les limites connues. Codex indique les contenus rédigés, leur statut de validation et les questions scientifiques à trancher par l'utilisateur. Toute opération de commit ou publication requiert un accord distinct.
