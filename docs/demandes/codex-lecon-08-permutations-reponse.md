# Leçon 08 — réponse de Codex

**Statut : brouillon soumis à la direction.** Aucun contenu nouveau n'est validé par cette note.

## Choix, niveau et prérequis

Sujet : permutations d'un ensemble fini, groupe symétrique et décomposition en cycles disjoints. Fichier et slug : `src/content/lessons/permutations-cycles.mdx`, `permutations-cycles`. Suivre des positions fournit une entrée concrète et conduit à une classification dont l'existence et l'unicité peuvent être démontrées complètement.

Niveau visé : fin de lycée ou début de licence selon l'expérience des applications et des preuves. Prérequis : ensembles finis, applications, bijections, composition et propriétés élémentaires d'un groupe ; la leçon 01 est utile mais ses résultats ne sont pas nécessaires à la preuve. Sont utilisés le principe des tiroirs et le plus petit entier positif, ainsi que la divisibilité et le plus petit commun multiple. Aucun résultat des leçons parallèles n'est admis. La signature est différée : sa bonne définition exigerait une démonstration supplémentaire que ce premier parcours ne développe pas. Actions, orbites au sens général et conjugaison sont laissées aux leçons correspondantes.

## Plan

1. Réarrangement de cartes et comparaison des ordres de composition.
2. Permutations, groupe symétrique, cycles, exemples et contre-exemple ; énoncé de décomposition et répétitions.
3. Démonstration progressive et preuve intégrale de l'existence et de l'unicité des cycles disjoints.
4. Lien démontré avec les rotations du carré.
5. Quatre exercices corrigés avec indices, dont un approfondissement sur les transpositions, puis reconstruction guidée.

## Précautions scientifiques

La composition se lit de droite à gauche. Les cycles sont définis par leurs flèches et fixent les autres éléments ; les points fixes sont omis et l'identité est le produit vide. L'unicité s'entend à permutation des facteurs et rotation de l'écriture de chaque cycle près, sans autoriser l'inversion du sens. La preuve utilise la finitude et la bijectivité ; une simple application d'un ensemble fini peut avoir une trajectoire qui entre dans un cycle sans revenir à son point de départ. Le calcul du nombre de répétitions est justifié cycle par cycle. Le lien au carré porte sur les permutations induites, sans affirmer que toutes les permutations sont des symétries géométriques. L'exploration ne remplace pas la preuve. Aucune affirmation historique ni aucun modèle interdisciplinaire n'est avancé.

## Module 2 — propositions à examiner

- **Objectifs :** reconnaître une permutation, composer avec une convention explicite, décomposer en cycles et raisonner sur leurs itérations.
- **Prérequis :** groupes, bijections, ensembles finis et divisibilité élémentaire.
- **Place :** proposer cette leçon en introduction au module, avant les actions et la conjugaison, sous réserve de validation de la progression globale.
- **Résultat central :** existence et unicité de la décomposition en cycles disjoints ; décomposition en transpositions en exercice.
- **Expérience :** manipulation des images et de leurs cycles décrite ci-dessous.
- **Connexions :** lien mathématique avec les rotations du carré ; aucune connexion interdisciplinaire n'est proposée ici.
- **Critères de maîtrise :** distinguer application et bijection, calculer une composition dans le bon ordre, retrouver les cycles et reconstruire le rôle de la finitude et de l'inverse dans la preuve.

Ces propositions ne modifient pas la progression et ne sont pas validées.

## Interaction proposée après validation

Présenter $n$ cartes numérotées et leur table d'images, avec $n$ entier de $2$ à $6$, valeur initiale $4$. Permettre de choisir deux images distinctes et de les échanger ; ce seul geste conserve la bijectivité. Valeur initiale : $1\mapsto3$, $2\mapsto1$, $3\mapsto2$, $4\mapsto4$. Un bouton applique la permutation aux positions courantes, un autre remet les cartes à leur position initiale ; afficher le nombre d'applications et la décomposition en cycles. Lors d'un changement de $n$, réinitialiser à l'identité. Observer les retours, les points fixes et les longueurs des cycles ; signaler que les essais ne constituent pas une preuve générale.

**Alternative textuelle permanente :** table des positions initiales, images et positions courantes ; sélecteurs et boutons accessibles au clavier pour échanger deux images, appliquer et remettre à zéro ; lecture textuelle des cycles, du compteur et des bornes. Les calculs de la leçon restent possibles sur papier.

## Points à trancher par la direction

- Valider le sujet, le niveau et son rattachement proposé au module 2 ; décider si le report de la signature convient.
- Valider le nombre et la difficulté des exercices et la reconstruction proposée.
- Retenir, modifier ou écarter l'interaction et ses bornes ; l'interface des trois modes relève d'une décision distincte.
- Valider séparément les propositions relatives à la progression.

## Vérifications

Contrôles de structure et de ponctuation effectués sans compilation. Aucun lancement de npm ou d'Astro ; compilation, rendu des formules et accessibilité restent à vérifier par Claude après remise.
