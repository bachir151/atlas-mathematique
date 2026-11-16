# Réponse Codex — leçon 20 : diagonalisation

**Statut : brouillon soumis à la direction ; aucun contenu nouveau n’est validé.**

La leçon « Diagonalisation & directions propres » se trouve dans `src/content/lessons/diagonalisation.mdx`. Ce slug court désigne directement le thème. Niveau visé : entrée progressive par des calculs dans le plan, puis début de licence pour les espaces vectoriels abstraits et la preuve du critère.

Prérequis : corps et calcul matriciel, espaces vectoriels de dimension finie, bases, dimension, noyau, applications linéaires et matrices dans une base. Les résultats admis des leçons parallèles sur les espaces vectoriels et les endomorphismes sont notamment l’existence de bases, le fait qu’une famille libre de dimension maximale est une base, les propriétés du noyau, la représentation matricielle et le changement de base. Le déterminant et le critère d’inversibilité ne sont évoqués que comme outil facultatif de recherche. Les leçons voisines n’étant pas encore validées, leur cohérence avec ces prérequis reste à examiner lors de leur validation.

Plan : exploration d’une application du plan et de ses itérations ; définitions ; critère par les dimensions des espaces propres et preuve progressive avec preuve intégrale ; exemples diagonalisable, non diagonalisable et dépendant du corps ; puissances et récurrences ; trois exercices corrigés ; reconstruction.

Précautions : le corps est explicité, les espaces sont de dimension finie non nulle, et le vecteur propre est non nul. La somme directe et le critère sont démontrés sans supposer les valeurs propres toutes distinctes. Une valeur propre répétée n’empêche pas à elle seule la diagonalisation. Les calculs sur les puissances incluent l’exposant zéro et les valeurs propres nulles. La récurrence est une application mathématique exacte, non une affirmation sur un phénomène réel. Le changement de corps dans l’exemple complexe modifie l’espace et les scalaires autorisés. Aucun critère fondé sur la multiplicité algébrique n’est supposé ni annoncé. Les essais et la figure ne remplacent pas la preuve.

Pour le module 4, proposition de critères de maîtrise : déterminer des espaces propres, distinguer valeur propre et vecteur propre, appliquer et justifier le critère de dimension, changer de base et calculer une itération, expliquer la dépendance au corps. Aucun changement à la liste des modules n’est proposé.

La direction est invitée à trancher la validation du texte, du niveau, des prérequis communs et de la proposition d’interaction. La leçon n’avance pas de référence historique ni de modèle interdisciplinaire nécessitant un choix scientifique supplémentaire.

## Interaction proposée après validation

Insérer la balise après la phrase exacte : « Les exemples ne suffisent pas à le décider. » Proposer une visualisation dans le plan réel de $u(x,y)=(2x+y,y)$, avec un vecteur initial $(x,y)$ et son image, ainsi que les droites propres $y=0$ et $y=-x$. Deux champs entiers $x,y$ varient de −3 à 3, par pas de 1, valeurs initiales $(1,1)$. Un entier $k$ de 0 à 5, initialement 1, choisit l’itération affichée ; représenter $u^k(x,y)$, en adaptant l’échelle et en l’indiquant. Afficher aussi les composantes $(x+y)(1,0)$ et $y(-1,1)$ et leurs images respectives par $u^k$. Le lecteur observe leur multiplication par $2^k$ et $1$, y compris pour le vecteur nul ; les essais ne prouvent pas le critère général.

Alternative textuelle permanente : champs accessibles au clavier, coordonnées exactes du vecteur, de ses deux composantes et de leurs images, formule $u^k(x,y)=(2^k(x+y)-y,y)$, et description des deux droites propres. Le texte et les calculs de la leçon restent utilisables sans la figure. Cette interaction est une proposition, non un composant développé ou validé.

## Vérifications

Contrôles de structure et de ponctuation sur les deux livrables seulement ; aucune compilation, installation, commande npm ou Astro. Claude effectuera les vérifications techniques après remise.
