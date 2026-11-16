# Note d'intégration — figures de la leçon 10 « Lagrange & conjugaison »

Fichiers créés : `src/figures/lagrange.ts`, `src/figures/lagrange-svg.ts`, `src/components/figures/LagrangeFigure.astro`, `src/scripts/lagrange-figures.ts`, `src/styles/figures-lagrange.css`, `tests/lagrange.test.mjs`. Fichiers partagés non modifiés : extraits ci-dessous.

## Choix de lecture de la note de Codex

- Deux volets indépendants, donc un composant à propriété `kind` : `classes-gauche` (id `figure-lagrange-classes`) et `conjugaison` (id `figure-lagrange-conjugaison`).
- Groupe D₄ calculé par matrices entières : `r(x, y) = (−y, x)`, `s(x, y) = (−x, y)`, composition de droite à gauche. Éléments ordonnés e, r, r², r³, s, rs, r²s, r³s.
- Les choix sont des listes déroulantes `<select>` (clavier natif) ; un seul bouton « Remettre les valeurs initiales » (aria-disabled quand on est aux valeurs initiales). Pas d'animation.
- « Le recouvrement » est lu comme : chaque élément de D₄ figure dans exactement une classe (numéro de classe Ck affiché sur chaque élément, pas de couleur seule) ; somme des tailles affichée.
- « Axes » : l'axe de s est vertical, celui de r²s horizontal, ceux de rs et r³s sont les diagonales y = −x et y = x (calculés comme droite fixée). Une rotation n'a pas d'axe : le texte le dit.
- Le nombre de conjugués distincts et l'indice 8 / |C(x)| sont affichés côte à côte (valeurs calculées, aucune affirmation générale).
- Emplacement : la note de Codex ne donne pas d'endroit ; propositions ci-dessous (à valider).

## 1. Balises MDX

```mdx
<LagrangeFigure kind="classes-gauche" number="1" />
<LagrangeFigure kind="conjugaison" number="2" />
```

## 2. Emplacement dans `src/content/lessons/lagrange-conjugaison.mdx`

- Figure 1 : juste après `</Definition>` de la définition des classes à gauche, c'est-à-dire après la phrase « Le représentant est placé à gauche. Ce sous-ensemble n’est pas nécessairement un sous-groupe : si $a\notin H$, il ne contient pas $e$, car $ah=e$ impliquerait $a=h^{-1}\in H$. » (ligne 46 environ, avant le théorème 1).
- Figure 2 : à la fin de la section « Connexions », après la phrase « … C’est un cas de la formule orbite-stabilisateur, abordée dans la leçon sur les actions ; l’argument donné ici ne la suppose pas. » (avant `</CourseSection>` de la section `connexions`).

## 3. Lignes à ajouter

`src/components/lesson/index.ts` :

```ts
import LagrangeFigure from '../figures/LagrangeFigure.astro';
// … et ajouter LagrangeFigure à l'objet lessonComponents
```

`docs/GABARIT-LECON.md` (tableau des composants) :

```
| `<LagrangeFigure>` | `kind` (`classes-gauche`, `conjugaison`), `number` | figures de la leçon 10 sur D₄ (huit symétries du carré) : classes à gauche d'un sous-groupe parmi cinq, conjugaison de x par g avec axes, conjugués distincts et centralisateur ; calcul exact par matrices entières, tableau et lecture textuelle |
```

`package.json` (test:figures) : ajouter `&& node --experimental-strip-types tests/lagrange.test.mjs`.

`scripts/check-build.mjs`, à la suite du bloc `sous-groupes-entiers` :

```js
    if (page.includes('lagrange-conjugaison')) {
      assert.equal(doc.querySelectorAll('[data-lagr-figure]').length, 2, 'Deux figures interactives');
      assert.ok([...doc.querySelectorAll('[data-lagr-status]')].every(status => status.textContent.trim()), 'Lecture textuelle des figures sans JavaScript');
      assert.match(doc.querySelector('#figure-lagrange-classes [data-lagr-status]').textContent, /^aH = \{r, r³\} : 2 éléments, ne contient pas e\./);
      assert.match(doc.querySelector('#figure-lagrange-conjugaison [data-lagr-status]').textContent, /L’axe vertical devient l’axe horizontal\./);
      assert.equal(doc.querySelectorAll('#figure-lagrange-classes [data-lagr-table] tr').length, 4, 'Tableau des classes présent');
      assert.equal(doc.querySelectorAll('#figure-lagrange-conjugaison [data-lagr-table] tr').length, 8, 'Tableau des conjugués présent');
    }
```

`tests/browser_site.py` : ajouter `'lagrange-static', 'lagrange-keyboard', 'lagrange-buttons'` aux deux listes de cas (lignes 38 et 43, à côté de `steps-*`), appeler `checks.lagrange()` là où `checks.steps()` est appelé (lignes 805 et 813), et ajouter la méthode :

```python
    # ---------- Lagrange figures (lesson « Lagrange & conjugaison ») ----------
    def lagrange(self):
        d = self.d
        page = '/cours/lagrange-conjugaison/'
        cls, conj = '#figure-lagrange-classes', '#figure-lagrange-conjugaison'
        status = lambda fig: d.js(f"return document.querySelector('{fig} [data-lagr-status]').textContent;")
        rows = lambda fig: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-lagr-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        choose = lambda fig, name, value: d.js(f"const f=document.querySelector('{fig} [data-lagr-param={name}]');f.value='{value}';f.dispatchEvent(new Event('change'));")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('aH = {r, r³} : 2 éléments, ne contient pas e.', 'L’axe vertical devient l’axe horizontal.'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const q=s=>document.querySelector(s);return {{
              enabled:[...document.querySelectorAll('{cls} select,{conj} select')].every(e=>!e.disabled),
              nodes:q('{cls} svg').querySelectorAll('.lagr-node').length,
              classes:q('{cls}').querySelectorAll('[data-lagr-table] tr').length,
              conjRows:q('{conj}').querySelectorAll('[data-lagr-table] tr').length,
              labels:[q('{cls} svg').getAttribute('aria-labelledby'),q('{conj} svg').getAttribute('aria-labelledby')].join(' ')}};""")
            assert state['enabled'] and state['nodes'] == 8 and state['classes'] == 4 and state['conjRows'] == 8, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['labels'].split()), state
            return state
        self.case('lagrange-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{cls} [data-lagr-param=sub]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow down: next subgroup {e, r, r², r³}
            r = rows(cls)
            assert r['Sous-groupe H'].startswith('{e, r, r², r³}, 4 éléments'), r
            assert r['Indice [D₄ : H]'].startswith('2,'), r
            d.js(f"document.querySelector('{conj} [data-lagr-param=g]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow down: g = r²
            r = rows(conj)
            assert r['Conjugué g x g⁻¹'] == 'r² s r² = s', r
            assert r['Axe obtenu'] == 'l’axe vertical', r
            return {'arrowKeys': True}
        self.case('lagrange-keyboard', keyboard)

        def buttons():
            self.open(page)
            choose(cls, 'sub', '0'); choose(cls, 'rep', '5')
            r = rows(cls)
            assert r['Classe aH'].startswith('{rs} (rs·e = rs)') and r['Classes à gauche distinctes'].startswith('8 :'), r
            choose(conj, 'x', '1'); choose(conj, 'g', '4')
            st = status(conj)
            assert st.startswith('g x g⁻¹ = s r s = r³.') and 'x = r est une rotation, sans axe' in st, st
            reset = f"document.querySelector('{conj} [data-lagr-action=reset]')"
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'false'
            d.js(reset + ".focus();"); d.key(''); time.sleep(0.1)
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {reset};"), 'Le focus doit rester sur le bouton indisponible'
            assert rows(conj)['Conjugué g x g⁻¹'] == 'r s r³ = r²s', rows(conj)
            return {'reset': True}
        self.case('lagrange-buttons', buttons)
```

Remarque : dans `lagrange-static`, `self.root`/`self.open`/`self.case` sont ceux de la méthode `steps`. Le texte attendu de `Classe aH` pour H = {e}, a = rs est `{rs} (rs·e = rs)`.
