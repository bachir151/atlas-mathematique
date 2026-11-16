# Leçon 09 — réponse de Codex

**Statut : brouillon, soumis à la validation de la direction.**

## Sujet et choix

« Actions de groupes, orbites & stabilisateurs », dans `src/content/lessons/actions-orbites-stabilisateurs.mdx`. Le slug nomme les trois notions et distingue cette leçon des permutations, des quotients et de Lagrange. Le carré assure une continuité concrète avec la leçon 01 ; les translations paires illustrent ensuite une action infinie.

## Niveau, prérequis et plan

Début de licence : ensembles, applications, bijections, groupes, sous-groupes, composition et inverses. Les leçons 01 et 04 aident à se familiariser avec les exemples et les sous-groupes. Les huit symétries du carré et leur liste sont utilisées comme fait géométrique dans l’exploration ; elles sont explicitées par leurs effets sur les sommets. Les règles d’action, les orbites, les stabilisateurs et les classes nécessaires sont définis dans le texte. Aucun résultat des leçons parallèles n’est admis : la formule de dénombrement est démontrée directement, sans Lagrange ni construction de quotient.

Plan : exploration du carré ; définition d’une action à gauche et exemples ; orbites, stabilisateurs, partition, transitivité et liberté ; bijection orbite–classes et formule finie, preuve progressive et intégrale ; application au carré et réduction de recherche en informatique ; quatre exercices corrigés ; reconstruction.

## Précautions scientifiques

Le produit agit de droite à gauche. Les classes à gauche sont des parties du groupe, sans prétendre qu’elles forment un groupe quotient. La bijection vaut aussi pour un groupe infini ; la formule numérique est énoncée pour un groupe fini. La transitivité est définie ici pour un ensemble non vide. Une action libre n’est pas nécessairement transitive, et réciproquement. L’application informatique exige l’invariance de la propriété étudiée. Les essais ne remplacent pas la preuve.

## Décisions à prendre

Valider ou demander une révision du niveau, du choix de la preuve par classes et des quatre exercices, ainsi que du rattachement au module 2. Proposition pour ce module, sans modifier la progression : savoir vérifier une action, calculer orbites et stabilisateurs, distinguer transitivité et liberté, et démontrer la correspondance entre orbite et classes du stabilisateur. La validation de la leçon et celle de l’interaction proposée ci-dessous sont distinctes.

## Interaction proposée après validation

Un carré et ses quatre sommets nommés $A,B,C,D$ dans l’ordre, avec sélection du groupe : quatre rotations (valeur par défaut) ou huit symétries. Sélection initiale de $A$, puis choix d’un sommet parmi les quatre et d’une transformation dans la liste du groupe choisi. Afficher l’image du sommet sélectionné, son orbite et la liste complète de son stabilisateur, puis regrouper les transformations selon leur image. Avec les huit symétries, observer deux transformations par image et comparer avec les quatre rotations. Les choix sont discrets et bornés aux listes indiquées ; une remise à zéro restaure rotation, $A$ et identité.

Alternative textuelle permanente : commandes au clavier et tableau donnant, pour chaque transformation, l’image de chacun des quatre sommets, avec liste textuelle de l’orbite et du stabilisateur du sommet choisi. La leçon reste complète sans l’interaction ; la visualisation illustre un cas fini et ne démontre pas le théorème général. Aucune figure n’est développée dans ce livrable.
