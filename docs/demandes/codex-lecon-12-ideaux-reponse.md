# Leçon 12 — idéaux : réponse de Codex

**Statut : brouillon, soumis à la validation de la direction.** Aucun contenu de cette proposition n’est présenté comme validé.

## Sujet et choix

« Idéaux & multiples », fichier `src/content/lessons/ideaux-multiples.mdx`, slug `ideaux-multiples` : les multiples de la leçon 04 offrent une entrée concrète, avant le passage à l’absorption dans un anneau et aux générateurs. Le sujet attribué est conservé.

## Niveau, prérequis et dépendances

Début de licence, accessible à une fin de lycée habituée aux preuves et aux ensembles. Prérequis : entiers relatifs, divisibilité, division euclidienne, sous-groupes additifs et axiomes d’un anneau commutatif unitaire. Le corps n’intervient que dans le dernier exercice, où sa propriété utile est rappelée. La leçon sur les anneaux et corps, rédigée en parallèle, est citée par thème ; ses définitions et propriétés de base sont admises, mais les hypothèses nécessaires sont rappelées ici. Aucun résultat de la leçon parallèle sur les quotients et morphismes d’anneaux n’est admis : une relation compatible est démontrée directement, et la construction du quotient lui est renvoyée. La preuve de la classification reprend l’argument de la leçon validée sur les sous-groupes des entiers pour rendre ce texte autonome.

## Plan

Exploration par $6$ et $4$ ; définition et contre-exemple ; classification des idéaux de $\mathbb Z$ ; idéaux engendrés, somme et intersection ; démonstration progressive et intégrale de la classification ; compatibilité d’une relation avec les opérations ; quatre exercices corrigés ; reconstruction.

## Précautions scientifiques

Anneaux commutatifs avec unité, anneau nul admis ; l’idéal propre est explicitement défini. Les coefficients des générateurs appartiennent à l’anneau. La réunion n’est pas affirmée toujours non idéale : un contre-exemple précis est donné. La preuve distingue l’idéal nul et traite les entiers négatifs par division euclidienne. Les calculs de somme et intersection sont justifiés sans supposer un théorème général sur PGCD ou PPCM. Les manipulations suggèrent et ne remplacent pas les preuves. Le lien avec les quotients est qualifié de lien mathématique démontré, sans anticiper leur construction.

## Décisions demandées à la direction

Valider ou modifier le niveau, le choix des anneaux commutatifs unitaires, le périmètre (y compris l’exercice sur les corps), le texte, les exercices et l’interaction proposée. Pour la progression du module 3, cette leçon peut suivre celle sur anneaux et corps et précéder celle sur quotients et morphismes ; cette proposition ne modifie pas `docs/PROGRESSION.md`. Aucune question scientifique bloquante identifiée.

## Interaction proposée après validation

**Emplacement exact :** après la phrase « Les exemples guideront nos conjectures ; ils ne démontrent pas les résultats généraux. » dans la section Exploration.

Afficher deux entiers générateurs $a,b$, réglables chacun de −12 à 12, valeurs initiales 6 et 4. Afficher sur une droite les entiers de −24 à 24, et distinguer les multiples de $a$, ceux de $b$, leur intersection et les combinaisons $ua+vb$ obtenues avec $u,v$ de −5 à 5. Deux curseurs pour $u,v$, initialement 1 et −1, montrent le calcul sélectionné et sa position. Préciser que la liste bornée des combinaisons peut omettre des éléments de l’idéal : elle ne prouve pas sa description générale. Inclure le cas $a=b=0$, sans division par zéro. Ne pas identifier la réunion à la somme.

**Alternative textuelle :** commandes accessibles au clavier et tableau des entiers affichés indiquant pour chacun les appartenances aux ensembles de multiples et l’existence éventuelle d’une combinaison dans les bornes choisies ; énoncer le calcul courant en texte. Les exemples et preuves de la leçon restent utilisables sans interaction.

## Vérifications et limites

Contrôles en lecture seule : une seule balise Proof, composants équilibrés, ancres de sections présentes ou fournies par Proof, nombre de dollars pair, aucun espace ordinaire avant la ponctuation double dans la leçon et aucun motif de formule interdit détecté. Aucune compilation ni test technique demandé à Codex. La compilation, le rendu KaTeX, l’accessibilité et l’intégration relèvent de Claude après remise. Aucun autre fichier ne doit être modifié dans cette tâche.
