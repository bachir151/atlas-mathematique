# Bilan technique — première mission

Date : 13 novembre 2026. Périmètre : ce dossier uniquement. Aucune opération Git, publication ou modification des consignes de gouvernance.

> Document historique de la première remise, avant l’installation des dépendances par la direction du projet. Les résultats actuels de compilation et les corrections réalisées à la reprise figurent dans [VERIFICATIONS.md](VERIFICATIONS.md).

## Fichiers et décisions

Tous les fichiers de l’arborescence du README sont des créations de cette mission, sauf `AGENTS.md` et `CLAUDE.md`, qui restent inchangés et ne font pas partie des créations. `node_modules/` contient seulement les dépendances de test récupérables hors ligne. Les dépendances de l’application restent déclarées dans `package.json` et ne sont pas installées. Aucun fichier de verrouillage complet ne peut être fourni tant que la résolution npm ne réussit pas.

- Pages et composants Astro : accueil éditorial, bibliothèque, Atlas et leçon séparés pour limiter le code client à chaque route.
- Modules TypeScript : interactions locales, chargement différé de Three.js et rendu à la demande.
- MDX, données de preuve et données d’Atlas séparées du rendu ; seuls des emplacements de contenu non validé sont présents.
- KaTeX préparé dans un composant dédié, sans création d’exemples ou de formules pédagogiques.
- CSS à tokens, thèmes crème/vert/encre, mise en page adaptative, focus visible, lien d’évitement et prise en compte du mouvement réduit.
- Compagnon intégralement simulé, sans clés API, stockage ni requête externe. Polices système et figures locales.

## Vérifications exécutées

| Vérification | Résultat |
| --- | --- |
| Node / npm | 22.22.3 / 10.9.8 |
| Installation npm de l’application | Bloquée : `EAI_AGAIN`, résolution de `registry.npmjs.org` impossible |
| `npm run test:core` | 5 tests réussis |
| `npm run test:dom` | 5 tests réussis sous jsdom 24.1.3 |
| `npm test` après corrections techniques | 10 tests réussis ; transcription dans `audits/tests-local.txt` |
| Analyse syntaxique TypeScript | 29 unités analysées, aucune erreur, avec TypeScript 6.0.3 récupéré dans le cache local ; ne remplace pas le typage Astro |
| Analyse CSSOM de la feuille CSS | 260 règles analysées sous jsdom ; ne remplace pas un contrôle visuel dans un navigateur |
| Contrastes des couleurs principales | Ratios calculés entre 4,69:1 et 13,20:1 ; détail dans `audits/contrast-local.txt`, sans certification de l’interface complète |
| Syntaxe Python du lanceur d’audit | Réussie avec `ast.parse`, sans fichier compilé généré |
| `npm run check` | Impossible : `astro: not found` après l’échec d’installation |
| `npm run build` | Impossible : `astro: not found` après l’échec d’installation |
| Serveur local, navigation dans un vrai navigateur, WebGL réel | Non vérifiés : application non compilable dans cet environnement |

Les tests DOM exécutent les contrôleurs TypeScript réels. Le carré et le compagnon utilisent le balisage source des composants après retrait de l’en-tête Astro et des scripts. Pour le catalogue, la progression et la carte, les tests utilisent des fixtures DOM minimales ; ils ne vérifient pas la compilation des templates Astro/MDX. Le test de repli 3D simule l’indisponibilité du module : il ne certifie ni un GPU réel ni la perte d’un contexte WebGL réel.

Les tests couvrent : normalisation et remise à zéro des rotations, recherche avec accents et filtres combinés, exclusion des liens non validés ou sans justification, cohérence des identifiants, présence de placeholders, historique borné, insertion littérale d’un message potentiellement malveillant, masquage du compagnon, progression synchronisée aux ouvertures manuelles, preuve intégrale indépendante et sélection dans le repli 2D.

## Premier audit et corrections

Le premier audit a été lancé automatiquement en mode sans outils. Aucun rapport d’analyse de Claude n’a été obtenu : son API est inaccessible. La sonde préalable a renvoyé `connection_failed` / `EAI_AGAIN` ; le premier passage complet a été interrompu à son délai maximal. Les empreintes des sources avant et après cette tentative sont identiques. Voir `audits/claude-1.md` et `audits/claude-1-sources.json`.

Il n’existe donc aucune remarque critique, importante ou mineure attribuable à Claude. Les corrections suivantes proviennent de la revue de Codex et sont couvertes par l’autorisation de correction des bugs techniques donnée pour cette mission :

1. Installation immédiate du nettoyage du renderer pour couvrir les erreurs pendant l’initialisation Three.js ; libération des ressources et annulation des callbacks à la sortie.
2. Pas de redimensionnement du buffer WebGL tant que les dimensions restent identiques.
3. Conservation du choix 2D si la personne sélectionne ou focalise un thème pendant le chargement de la 3D.
4. Progression de preuve recalculée depuis les panneaux réellement ouverts ; possibilité de rouvrir les panneaux après une fermeture manuelle.
5. Remise à zéro immédiate du carré pour éviter une rotation inverse traversant tout l’historique.
6. Navigation de leçon collante avec accès direct à la preuve intégrale et décalage des ancres.
7. Correction du balisage d’une option du filtre et désactivation initiale des commandes dépendantes de JavaScript ; messages d’alternative sans JavaScript.
8. Suppression des polices distantes et amélioration de la lisibilité des textes de statut.

Aucun contenu mathématique validé n’a été modifié. Les modifications MDX concernent uniquement la présentation d’un emplacement provisoire.

## Contre-audit et suites

Le second et dernier passage automatique a été lancé après les corrections et s’est également terminé sans rapport au délai maximal de 120 secondes. Les sources sont restées inchangées pendant cette tentative. Le diagnostic est conservé dans `audits/claude-2.md` avec les empreintes associées. Aucun troisième audit n’a été lancé pour cette mission. Ces deux tentatives ne constituent pas des audits techniques réussis : aucun avis indépendant de Claude n’a été reçu.

La priorité restante est de rétablir l’accès réseau pour installer l’application, produire le verrouillage npm et exécuter `astro check`, la compilation et les contrôles dans un navigateur. Il faudra alors vérifier les largeurs mobiles, le zoom texte, la navigation clavier, les lecteurs d’écran, les contrastes, le rendu des futurs contenus KaTeX et le comportement WebGL sur matériel réel.

L’intégration de cours, preuves, exercices et connexions scientifiques attend les textes et données validés par ChatGPT et la direction du projet. Une éventuelle opération Git ou publication nécessitera une autorisation distincte ; aucune n’est engagée.
