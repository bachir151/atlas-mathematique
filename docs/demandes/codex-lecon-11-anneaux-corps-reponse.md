# Leçon 11 — remise de Codex

**Statut :** brouillon, soumis à la validation de la direction. Aucune publication ni validation n’est présumée.

## Sujet et progression

Le fichier `src/content/lessons/anneaux-corps.mdx`, de slug `anneaux-corps`, introduit les anneaux commutatifs unitaires et les corps à partir des calculs modulo six. Le titre nomme les deux structures centrales ; le slug est court et distinct des sujets attribués aux leçons suivantes.

Niveau visé : fin de lycée pour les exemples et premières définitions, début de licence pour la formalisation et l’exercice sur les anneaux intègres finis. Prérequis : groupes commutatifs, classes de restes et addition sur le quotient, divisibilité entière, PGCD et théorème de Bézout, dont l’énoncé est rappelé. Les propriétés usuelles de calcul dans les entiers et rationnels sont supposées connues. Aucune leçon parallèle n’est nécessaire ni aucun résultat de ces leçons admis.

Plan : exploration modulo six ; axiomes et règles de calcul ; inversibles, diviseurs de zéro, intégrité et corps ; exemples dans les entiers, rationnels et classes de restes ; critère d’inversibilité modulo $n$ et caractérisation des modules premiers, avec démonstration progressive et intégrale ; trois exercices corrigés ; reconstruction.

## Précautions scientifiques

La convention retenue inclut l’anneau nul parmi les anneaux, mais exclut $0=1$ des anneaux intègres et des corps. Tous les anneaux considérés sont commutatifs et unitaires. La multiplication des classes est justifiée indépendamment du choix des représentants. Le théorème utilise Bézout comme prérequis explicite ; l’exercice sur la finitude démontre le passage nécessaire de l’injectivité à la surjectivité. Les exemples finis motivent les résultats sans tenir lieu de preuve générale. Les idéaux, les morphismes d’anneaux, les polynômes et la classification des corps finis ne sont pas anticipés.

## Décisions proposées à la direction

Confirmer la convention incluant l’anneau nul, le recours à Bézout comme prérequis, le niveau de l’exercice final et le périmètre commutatif. Confirmer aussi l’emplacement et l’opportunité de la figure ci-dessous. La progression du module 3 proposée ici commence par les deux lois et leurs limites ; les thèmes ultérieurs restent ceux de la progression de référence.

## Interaction proposée après validation

**Table de multiplication des classes.** Choisir $n$ entier de 2 à 12, initialement 6 ; choisir deux restes $a,b$ entre 0 et $n-1$, initialement 2 et 3. Afficher la table complète des produits modulo $n$, mettre en évidence la case sélectionnée et afficher son calcul entier et son reste. Signaler pour chaque reste si un inverse existe et, le cas échéant, lequel ; signaler les couples de facteurs non nuls de produit nul. Au changement de $n$, ramener les deux choix à leurs restes modulo le nouveau $n$. Le lecteur compare notamment les produits nuls modulo 6 et l’existence d’inverses modulo 5. L’outil illustre des cas finis sans prouver le critère général.

Alternative textuelle accessible sans manipulation : table HTML complète avec en-têtes de lignes et colonnes, calcul et résultat de la sélection, liste textuelle des inversibles avec leurs inverses et des couples non nuls de produit nul. Toutes les commandes doivent être utilisables au clavier.

**Emplacement exact proposé :** dans la section « Exploration », après la phrase « La seconde équation a la solution $x=5$ ; la première n’en a aucune parmi les six restes. »
