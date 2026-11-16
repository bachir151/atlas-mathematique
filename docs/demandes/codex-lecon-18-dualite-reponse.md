# Leçon 18 — formes linéaires et dualité

**Statut :** brouillon soumis à la direction, non validé. Fichier proposé : `src/content/lessons/formes-lineaires-dualite.mdx` ; slug `formes-lineaires-dualite`, qui nomme l’objet étudié et son cadre sans réduire la dualité à une image géométrique.

## Niveau, prérequis et plan

Début de licence. Prérequis : corps commutatif, espace vectoriel, applications linéaires, famille libre et génératrice, base et unicité des coordonnées. Les notions et résultats généraux sur les espaces vectoriels sont admis de la leçon voisine sur les espaces vectoriels abstraits, en cours de rédaction parallèle ; aucun numéro de théorème de cette leçon n’est supposé. Les opérations et l’évaluation des polynômes renvoient aux leçons déjà validées sur les corps et les polynômes. Les exemples calculatoires utilisent les réels.

1. Explorer les coordonnées dans deux bases du plan.
2. Définir forme linéaire, dual et base duale ; distinguer vecteurs et formes.
3. Démontrer progressivement et intégralement le théorème de la base duale finie.
4. Relier l’évaluation des polynômes aux formes linéaires.
5. Exercices corrigés : linéarité, base oblique, valeurs prescrites, limite en dimension infinie.
6. Reconstruction de la preuve et des dépendances au choix de base.

## Précautions scientifiques et choix soumis à la direction

Le théorème suppose explicitement une base finie non vide et un corps commutatif quelconque. Le cas de l’espace nul, dont la base est vide et le dual nul, est laissé hors de l’énoncé pour éviter des conventions de sommes vides ; son inclusion est un choix possible pour la direction. La base duale dépend de la base initiale ; l’égalité des dimensions ne fournit pas à elle seule une identification canonique de l’espace avec son dual. Aucune structure euclidienne n’est supposée. L’exemple des polynômes montre que les formes coordonnées d’une base infinie ne constituent pas nécessairement une famille génératrice du dual algébrique. Il ne prétend pas déterminer la dimension de ce dual.

À trancher : validation du sujet, du niveau, du périmètre limité aux bases finies non vides, des exercices et de la manipulation proposée. Le double dual et les applications transposées sont volontairement laissés à un approfondissement ultérieur. Proposition pour le module 4 : placer cette leçon après les espaces vectoriels abstraits ; elle prépare le langage des coordonnées et des formes, sans présumer le contenu des leçons parallèles sur les endomorphismes et la diagonalisation.

## Interaction proposée après validation

**Emplacement exact :** après la phrase « La règle qui lit cette coordonnée a changé avec la base. » dans la section Exploration.

Dans le plan réel, afficher la base fixe $b_1=(1,0)$, $b_2=(1,1)$ et un vecteur $v=(x,y)$. Deux curseurs entiers $x,y$ vont de $-5$ à $5$, valeurs initiales $x=3$, $y=2$. Afficher simultanément les coordonnées usuelles $(x,y)$, les coordonnées $(x-y,y)$ dans la base oblique, les décompositions correspondantes et les valeurs des formes $b^1(v)=x-y$, $b^2(v)=y$. Montrer les composantes selon les deux bases avec des couleurs accompagnées de libellés. Le lecteur peut observer que le vecteur est le même dans les deux décompositions et que les règles de lecture changent avec la base. Les essais suggèrent les formules mais ne remplacent pas leur justification dans la leçon.

**Alternative textuelle complète :** champs numériques accessibles avec les mêmes bornes, valeurs et libellés ; texte actualisé donnant $v$, les deux décompositions et les deux valeurs de formes. Sans interaction, conserver l’exemple calculé $(3,2)=3e_1+2e_2=1b_1+2b_2$ et les formules générales déjà présentes dans la leçon. Aucun composant existant n’est demandé ni inséré.
