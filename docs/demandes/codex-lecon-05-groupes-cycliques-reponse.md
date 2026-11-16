# Leçon 05 — réponse de Codex

**Statut : brouillon soumis à la direction.** Aucun contenu nouveau n’est validé par cette note.

## Choix et niveau

Sujet : sous-groupe engendré par un élément, ordre fini ou infini, puissances et classes modulo un entier, avec les rotations du carré. Fichier : `src/content/lessons/groupes-cycliques.mdx` ; slug : `groupes-cycliques`. Ce nom décrit le thème et prolonge les leçons sur les rotations et les sous-groupes de $\mathbb Z$.

Niveau visé : fin de lycée ou début de licence selon l’aisance avec les ensembles et les preuves. Prérequis : définition d’un groupe, inverses, entiers relatifs, divisibilité et division euclidienne ; classification des sous-groupes de $\mathbb Z$ de la leçon 04. Les règles des puissances entières sont utilisées comme outil. Le dernier exercice utilise le PGCD et Bézout, établis dans la leçon 04. Les rotations du carré sont un exemple de la leçon 01, non nécessaire à la preuve générale.

## Plan

1. Cadran et question du premier retour.
2. Sous-groupe engendré, groupe cyclique, ordre et exemples fini et infini.
3. Théorème sur l’égalité et le nombre des puissances ; preuve progressive et intégrale par les sous-groupes de $\mathbb Z$.
4. Construction élémentaire des classes modulo $n$ et correspondance avec les puissances, puis cadran.
5. Quatre exercices corrigés et reconstruction guidée.

## Précautions scientifiques

L’ordre est défini par le premier retour strictement positif, avec le cas infini et l’identité explicités. Un retour donné n’est pas forcément le premier. La preuve distingue les deux cas et traite les exposants négatifs. Le groupe ambiant peut être non commutatif ou infini ; seules les puissances d’un même élément commutent. Les classes modulo $n$ sont construites directement pour $n>0$, leur addition est justifiée et la correspondance est démontrée sans présupposer la théorie des quotients ni celle des morphismes. Le cadran est un modèle de positions, pas une preuve par observation. Aucun contenu validé n’est modifié.

Résultats admis de leçons existantes : classification des sous-groupes de $\mathbb Z$, PGCD et Bézout de la leçon 04 ; description des rotations du carré de la leçon 01. Aucun résultat des leçons parallèles sur les morphismes, les quotients, les permutations, les actions ou Lagrange n’est admis ni redémontré. La correspondance concrète est établie ici pour rendre la leçon autonome ; la théorie générale est renvoyée aux thèmes voisins.

## Propositions pour le module 1

À examiner, sans modifier la progression : placer cette leçon après les groupes et les sous-groupes de $\mathbb Z$ ; viser la reconnaissance d’un générateur, la distinction entre ordre fini et infini et la justification d’une égalité de puissances. Retenir comme critère de maîtrise la reconstruction de la preuve et la capacité de calculer dans un cycle sans confondre un retour avec le premier retour. La correspondance avec les classes d’entiers prépare les morphismes et quotients sans imposer leur étude préalable.

## Interaction proposée après validation

Un cadran de $n$ positions numérotées de 0 à $n-1$, avec $n$ entier de 2 à 24 (défaut 12), et un pas entier $k$ de $-24$ à 24 (défaut 4). Départ en 0 ; commandes « avancer d’un pas », « reculer d’un pas » et « recommencer ». Afficher le nombre signé de pas, la position comme reste entre 0 et $n-1$, et l’historique des positions jusqu’à 48 gestes, avec indication explicite si cet historique est tronqué. Observer le retour après trois pas pour les valeurs par défaut, comparer avec le pas 2, essayer le pas 0 et un pas négatif. L’exploration suggère une période ; le théorème la justifie. Le cadran représente des positions discrètes, non une trajectoire physique.

**Alternative textuelle permanente :** champs et commandes accessibles au clavier, annonce textuelle du nombre de pas et de la position courante, historique ordonné avec les mêmes limites et indication de troncature. La leçon et ses exercices restent praticables sur papier, sans figure ni interaction.

## Points à trancher par la direction

- Valider le sujet, le niveau et le rattachement au module 1, ainsi que l’usage de la classification de la leçon 04 comme prérequis.
- Valider la construction élémentaire de $\mathbb Z/n\mathbb Z$ et sa place avant les leçons générales sur morphismes et quotients.
- Valider ou ajuster les exercices, notamment l’approfondissement par Bézout, et la reconstruction.
- Retenir, modifier ou écarter l’interaction et ses bornes ; décider séparément de l’interface des trois modes et des propositions de progression.

## Vérifications

Contrôles de structure manuels demandés : une seule preuve progressive, ancres de navigation présentes, ponctuation française et délimiteurs mathématiques vérifiés. Compilation, rendu KaTeX et accessibilité restent à vérifier par Claude. Aucun npm, Astro, installation ou compilation n’a été lancé.
