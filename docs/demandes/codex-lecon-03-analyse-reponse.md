# Remise à la direction — Leçon 03 : Suites géométriques & sommes infinies

Rédaction de Codex du 14 novembre 2026, en réponse à `docs/demandes/codex-lecon-03-analyse.md` et à l’autorisation explicite de la direction.

## Livrables et statut

- `src/content/lessons/suites-geometriques-sommes-infinies.mdx` : leçon complète, `status: "draft"`, `domain: "Analyse"`, `number: "03"`, `companion: false`.
- `docs/demandes/codex-lecon-03-analyse-reponse.md` : présente note de remise.

Le slug retenu est `suites-geometriques-sommes-infinies`. Le contenu est soumis à la validation de la direction et n’est pas présenté comme validé. Aucun texte scientifique antérieurement validé n’est modifié.

L’écriture dans le projet est limitée à ces deux fichiers. `JURNAL.md` n’est donc pas actualisé ; la continuité de cette rédaction est consignée dans cette note. Le catalogue, l’Atlas, les autres leçons et les fichiers techniques restent hors périmètre. Aucun commit, push, serveur de développement ou déploiement n’est demandé.

## Sujet retenu et raison du choix

**Suites géométriques & sommes infinies** introduit l’analyse à partir d’une question accessible : ajouter des moitiés successives donne-t-il une longueur totale égale à un segment entier ?

Ce choix permet de construire la notion de limite sans dérivée, intégrale ni logarithme. Il distingue trois objets souvent confondus : un terme, une somme partielle et la limite des sommes partielles. Le résultat central donne une somme, mais aussi une erreur exacte : le lecteur peut déterminer combien d’étapes suffisent pour une précision prescrite.

La continuité avec les deux premières leçons est mathématique et facultative : conserver les distances, comme une réflexion, et les réduire, comme une contraction, produit des comportements différents sous itération. Le cas affine réel est entièrement démontré. La leçon ne dépend pas de la lecture des cours précédents.

## Niveau et prérequis

Le parcours principal vise le **lycée**, avec accompagnement possible pour une première rencontre avec les quantificateurs. Prérequis : fractions, puissances entières, calcul algébrique élémentaire, comparaison d’inégalités et valeur absolue. L’interprétation de la valeur absolue, le vocabulaire des suites, la somme finie, la définition de la limite et le principe de récurrence sont explicités.

Le cadre est celui des réels usuels. La propriété d’Archimède et l’inégalité triangulaire sont signalées comme propriétés de base utilisées ; la construction des réels et la démonstration de ces propriétés ne font pas partie du cours. Aucun théorème général sur les suites monotones, la continuité ou les points fixes n’est requis.

Les raisons négatives figurent dans le parcours principal pour distinguer convergence et monotonie. Les connexions et les exercices 4 et 5 sont **facultatifs**, de niveau lycée avancé à début de licence : condition nécessaire de convergence d’une série, contre-exemple harmonique et itération affine. L’approfondissement reste élémentaire mais demande davantage de maîtrise des indices et des preuves.

## Plan

1. **Explorer** les moitiés successives, sur une feuille ou par un tableau exact. Distinguer la conjecture issue des premiers rangs d’une preuve pour toutes les précisions.
2. **Définir** suite, raison géométrique, convergence, somme partielle et somme d’une série. Justifier l’unicité de la limite. Énoncer la somme géométrique et son reste exact.
3. **Démontrer** en quatre étapes : identité finie ; inégalité de croissance par récurrence ; convergence des puissances par la propriété d’Archimède ; convergence des sommes et erreur exacte. Une preuve intégrale autonome reste immédiatement accessible.
4. **Relier** isométrie et contraction sur la droite réelle, puis démontrer l’existence d’un unique point fixe et la convergence de toute itération affine de raison de valeur absolue inférieure à 1.
5. **S’exercer**, avec un indice et une correction par exercice : nombre de moitiés nécessaire ; somme alternée et parité ; sens de `0,999…` ; nécessité mais insuffisance de la convergence du terme vers zéro ; deux itérations affines.
6. **Reconstruire** les définitions, la preuve et le choix d’un nombre d’étapes à partir d’une erreur.

## Précautions scientifiques

- Une série est définie par la limite de ses sommes partielles. Aucun calcul algébrique sur une « addition infinie » n’est utilisé pour établir cette limite.
- Le calcul de la somme finie est séparé de la convergence. La condition `q ≠ 1` suffit à l’identité finie, tandis que `|q| < 1` fonde le théorème sur la somme infinie. Les cas `q = 1`, `q = −1`, `q = 0` et le premier terme nul sont explicités.
- L’indice initial est 0 et une somme partielle d’indice `N` contient `N+1` termes. Le passage aux `m` moitiés de l’exploration utilise explicitement `N = m−1`. La convention de puissance au rang 0, y compris pour la raison nulle, est annoncée.
- La convergence de `|q|ⁿ` n’est pas supposée : elle est prouvée par une inégalité établie par récurrence et par la propriété d’Archimède. La preuve intégrale reprend ces arguments et couvre les cas nuls.
- La définition traite chaque précision strictement positive et tous les indices au-delà d’un rang. Les calculs d’erreur et les exercices distinguent les seuils stricts et larges.
- Le reste signé et l’erreur absolue sont distingués. Une raison négative peut donner une convergence oscillante. Les tableaux et toute future figure ne constituent pas une preuve.
- L’écriture `0,999…` est définie ici par une limite de décimaux finis. Le cours ne suppose pas une règle sur les développements décimaux pour établir l’égalité à 1.
- La condition « le terme tend vers zéro » est nécessaire mais non suffisante pour la convergence d’une série. Les deux affirmations sont démontrées dans l’exercice 4, avec un regroupement fini par blocs pour la série harmonique.
- La contraction et le point fixe sont étudiés dans le seul cadre explicite des applications affines réelles. Aucun théorème général de point fixe ou résultat sur des espaces métriques n’est annoncé comme démontré.
- L’erreur mathématique exacte est distinguée de l’erreur d’arrondi d’un calcul en machine. Il n’est pas proposé de modèle scientifique, d’affirmation historique ou de lien interdisciplinaire nécessitant une référence extérieure. Les résultats dépassant les propriétés de base annoncées sont démontrés dans le texte.

## Points à trancher par la direction

1. Valider le sujet et la rédaction comme leçon 03 du domaine Analyse.
2. Confirmer le niveau lycée et la présence de la définition quantifiée de la limite et de sa preuve dans le parcours principal. Proposition : les conserver, avec leur explication en langage courant.
3. Confirmer la place des raisons négatives dans le parcours principal et des approfondissements dans le parcours facultatif. Proposition : conserver la somme alternée, les deux connexions et les exercices 4 et 5.
4. Choisir les figures ou interactions à faire développer par Claude après validation. Les deux propositions ci-dessous sont indépendantes ; la première est prioritaire pour le parcours principal.

Le changement de statut, l’intégration au catalogue, les liens de l’Atlas et toute publication relèvent d’une étape ultérieure. Aucun passage scientifique n’est laissé à compléter dans le brouillon.

## Figures et interactions proposées pour Claude

Ces propositions fixent des objectifs pédagogiques et ne constituent pas une autorisation de développement. Le texte et les formules suffisent sans figure. Les commandes doivent être accessibles au clavier et les informations disponibles sans animation ; aucune mesure approchée ne doit être présentée comme une preuve.

### 1. Sommes géométriques, limite et erreur

- **Objets :** les termes `u_n = a qⁿ`, les sommes partielles `S_N`, la limite `L = a/(1−q)` et le reste signé `R_N = L−S_N`. Deux lectures complémentaires : pour le préréglage des moitiés, un segment unité découpé en morceaux ; pour tous les paramètres, des points `(n,S_n)` sur un graphique discret, la droite horizontale `L` et la bande de précision ouverte `(L−ε,L+ε)`. Ne pas relier les points par une courbe suggérant que l’indice est continu.
- **Paramètres :** `a` entre −2 et 2, par pas de 0,1 ; `q` entre −0,9 et 0,9, par pas de 0,1 ; `N` entier entre 0 et 80. Choix de précision parmi `1/10`, `1/100`, `1/1000`. Valeurs initiales : `a=0,5`, `q=0,5`, `N=3`, `ε=1/100`. Préréglage alterné : `a=1`, `q=−0,5`, `N=3`. Le découpage en longueurs positives est réservé au préréglage des moitiés ; des sommes signées ne doivent pas être représentées comme des longueurs ajoutées positives.
- **État initial attendu :** avec les moitiés et `N=3`, il y a 4 morceaux, `S_3=15/16`, `L=1`, `R_3=1/16`. Le premier rang satisfaisant strictement l’erreur `1/100` est `N=6`, soit 7 morceaux.
- **À observer :** différence entre terme et somme ; décroissance de l’erreur ; approche par-dessous dans les moitiés ; alternance autour de la limite pour la raison négative. Avec `a=1` et `q=−1/2`, `S_3=5/8`, `L=2/3`, `R_3=1/24`. Faire varier une raison proche de 1 montre que le nombre de rangs nécessaire dépend de la raison fixée.
- **Contrôle de précision :** afficher le test `|R_N| < ε` à partir de la formule d’erreur, avec la nature exacte ou approchée du résultat indiquée. Puisque `|R_N|` est non croissant en `N`, une fois ce test établi exactement, il reste vrai à tous les rangs ultérieurs pour les paramètres fixés. Si aucun rang affiché ne satisfait le test, annoncer « Précision non atteinte dans les 81 sommes affichées », sans conclure à une divergence. Pour `a=0` ou `q=0`, traiter explicitement les erreurs nulles. Si des comparaisons exactes des paramètres décimaux rationnels sont retenues, leur réalisation technique appartient à Claude.
- **Alternative textuelle :** paramètres courants, nombre de termes `N+1`, expression de `S_N`, `L`, `R_N` et `|R_N|`, position par rapport à la limite et résultat du test de précision. Une table statique des quatre premières sommes, déjà fournie pour les moitiés et décrite pour le cas alterné, garantit une lecture sans graphique. Un affichage décimal arrondi à `L` doit rester accompagné de l’erreur, et ne doit jamais annoncer que la limite est atteinte si le reste exact est non nul.
- **Placement proposé :** après l’exemple de la somme alternée, ou dans l’exploration avec les seuls paramètres des moitiés puis une extension après le théorème.

### 2. Itération affine et point fixe

- **Objets :** une droite réelle, le point fixe `p=b/(1−q)`, les positions successives `x_n` et les erreurs `e_n=x_n−p`. Une table des itérations suffit ; un graphe complémentaire des points `(n,x_n)` peut montrer la limite horizontale `p`.
- **Paramètres :** `q` entre −0,9 et 0,9 par pas de 0,1 ; `b` entre −5 et 5 par pas de 0,5 ; `x_0` entre −10 et 10 par pas de 0,5 ; rang entier de 0 à 40. Valeurs initiales : `q=0,5`, `b=3`, `x_0=0`, rang 0. Commandes « Étape suivante » et « Revenir au début », sans lecture automatique nécessaire. Changer un paramètre repart du rang 0.
- **À observer :** au préréglage initial, `p=6`, puis `x_0=0`, `x_1=3`, `x_2=4,5`, `x_3=5,25` ; la distance au point fixe est divisée par 2 à chaque étape. Un second préréglage `q=−0,5`, `b=4,5`, `x_0=7` donne `p=3`, puis les positions `7`, `1`, `4`, `2,5` : l’erreur change de signe et sa valeur absolue est divisée par 2. Pour `q=0`, le point fixe est atteint en une étape ; pour `x_0=p`, la position reste fixe dès le départ.
- **Alternative textuelle :** relation de récurrence, paramètres, valeur du point fixe et tableau des rangs avec `x_n`, `e_n` et `|e_n|`. Montrer la formule exacte `e_n=qⁿ(x_0−p)` et distinguer sa valeur mathématique de son affichage arrondi. Adapter l’échelle aux valeurs, car la plage des paramètres peut placer `p` hors de l’intervalle initial proposé pour `x_0`.
- **Placement proposé :** à la fin de la section facultative « Connexions », après les formules et leur démonstration.

## Vérifications

Les deux commandes demandées ont été exécutées avec **Node v22.23.4** depuis `/tmp/codex-lecon03-zi_xkntu/`. Cette copie contient `src/`, `public/`, `tests/`, `scripts/`, les configurations, les manifestes et une copie des dépendances installées, sans lien vers le dossier de dépendances du projet. Ce choix évite de produire des caches ou des résultats de compilation dans le projet. Le cache npm est placé dans `/tmp/codex-lecon03-npm-cache/` et la télémétrie Astro est désactivée pour ces commandes.

```sh
export PATH=/home/elbash/.nvm/versions/node/v22.23.4/bin:$PATH
export ASTRO_TELEMETRY_DISABLED=1
export npm_config_cache=/tmp/codex-lecon03-npm-cache
npm run check
ATELIER_DRAFTS=1 npx astro build --outDir /tmp/codex-drafts-build-03
```

Résultats réels :

- **Typage et schéma :** `npm run check` réussi, 58 fichiers, 0 erreur, 0 avertissement et 0 indication.
- **Compilation des brouillons :** réussie dès le premier passage depuis la copie temporaire, 9 pages générées, dont `/cours/suites-geometriques-sommes-infinies/`. Aucune erreur `EXDEV` ni erreur de compilation étrangère à la leçon rencontrée.
- **HTML généré, contrôlé avec Node et JSDOM :** les 7 ancres de navigation sont présentes, tous les identifiants sont uniques et tous les liens internes à la page trouvent leur cible. Une seule démonstration, 4 étapes, une preuve intégrale présente hors de tout volet `details` ; 5 exercices ayant chacun un indice et une correction. Statut brouillon affiché. **445 expressions KaTeX et 445 éléments MathML**, aucun élément d’erreur KaTeX, aucun délimiteur de bloc `$$` brut dans le texte hors formules rendues.
- **Structure du fichier :** composants équilibrés, séparations par lignes vides présentes, une seule `<Proof>`, aucun composant d’expérience, aucune commande de lien ou de HTML dans les formules. Espaces insécables de la prose contrôlés.
- **Calculs exacts :** vérification avec des fractions rationnelles des sommes alternées et de leurs restes, des trois seuils minimaux des exercices 1, 2 et 5, et de l’état initial du préréglage alterné proposé pour la première figure.
- **Fidélité de la copie :** après compilation, les fichiers copiés de `src/`, `public/`, `tests/` et `scripts/` ont été comparés aux fichiers actuels du projet : aucune différence. Le manifeste est également identique. Dépendances constatées dans la copie utilisée : Astro 7.4.12, MDX 8.1.6, KaTeX 0.19.1, Three.js 0.187.0 et p5.js 2.4.0.

**Périmètre et travail simultané.** Une empreinte des fichiers du projet a été relevée avant la rédaction, hors `node_modules/` et `.git/`. La comparaison ultérieure retrouve les deux nouveaux livrables, ainsi que des changements simultanés de `JURNAL.md`, `package.json`, `package-lock.json` et de fichiers de caches, de compilation et de résultats navigateur. La demande annonçait une mise à jour des dépendances en parallèle. Ces changements ne sont pas attribués à cette rédaction : aucune de ses commandes d’écriture ne vise ces fichiers et ils n’ont pas été restaurés. Aucun fichier préexistant de contenu, de code, de style, de données ou de tests n’a changé dans cette comparaison. Les seules écritures de cette rédaction dans le projet concernent la leçon et la présente note ; toutes ses opérations de vérification produisent leurs fichiers dans `/tmp/`.

Ces contrôles ne valent pas vérification visuelle, navigation clavier ou lecture par lecteur d’écran dans un navigateur. Aucun serveur de développement, commit, push ou déploiement n’a été lancé par Codex. Restent la validation scientifique et pédagogique par la direction, puis l’intégration et les vérifications d’affichage par Claude dans le périmètre qui lui sera autorisé.
