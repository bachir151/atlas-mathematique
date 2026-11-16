# Figure leçon 15 — note d'intégration pour Claude

Fichiers prêts (non branchés) : `src/figures/irred.ts`, `src/figures/irred-svg.ts`, `src/components/figures/IrreducibleFigure.astro`, `src/scripts/irred-figures.ts`, `src/styles/figures-irred.css`, `tests/irred.test.mjs` (10 tests node : réussis).

## 1. Balise MDX

```mdx
<IrreducibleFigure number="1" />
```

## 2. Import du composant (pour information)

```ts
import IrreducibleFigure from '../figures/IrreducibleFigure.astro';
```

## 3. Bloc de `scripts/check-build.mjs`

```js
    if (page.includes('irreductibilite-polynomes')) {
      assert.equal(doc.querySelectorAll('[data-irred-figure]').length, 1, 'Une figure interactive');
      assert.match(doc.querySelector('[data-irred-status]').textContent, /X² \+ X \+ 1 sur ℤ\/2ℤ : P\(0\) = 1, P\(1\) = 1, racines : aucune\./, 'Lecture textuelle de la figure sans JavaScript');
      assert.match(doc.querySelector('[data-irred-figure]').textContent, /8 polynômes.*ne démontre rien/s, 'Plage finie annoncée');
      assert.equal(doc.querySelectorAll('[data-irred-table] tr').length, 8, 'Tableau des 8 polynômes présent');
      assert.equal(doc.querySelectorAll('[data-irred-table] th[scope="row"]').length, 8, 'En-têtes de lignes');
      assert.equal(doc.querySelectorAll('[data-irred-figure] input[type="radio"]').length, 6, 'Trois groupes de boutons radio');
    }
```

## 4. Méthode de `tests/browser_site.py`

```python
    # ---------- Irreducible figure (lesson « Polynômes irréductibles & racines ») ----------
    def irred(self):
        d = self.d
        page = '/cours/irreductibilite-polynomes/'
        fig = '#figure-irreductible'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-irred-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-irred-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        pick = lambda name, value: d.js(f"document.querySelector('{fig} [data-irred-choice={name}][value=\"{value}\"]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('X² + X + 1 sur ℤ/2ℤ : P(0) = 1, P(1) = 1', 'ne démontre rien'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              radios:f.querySelectorAll('input[type=radio]').length,
              rowHeads:f.querySelectorAll('[data-irred-table] th[scope=row]').length,
              current:f.querySelector('[data-irred-table] tr[aria-current=true]').getAttribute('data-irred-row')}};""")
            assert state['enabled'], state
            assert state['radios'] == 6 and state['rowHeads'] == 8, state
            assert state['current'] == '2-1-1', state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'radios': state['radios']}
        self.case('irred-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-irred-choice=degree][value=\"2\"]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow right: degree 3
            r = rows()
            assert r['Degré'] == '3', r
            assert 'X³ + X + 1' in r['Polynôme'], r
            d.js(f"document.querySelector('{fig} [data-irred-choice=c][value=\"1\"]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow left: c = 0
            r = rows()
            assert r['Racines dans ℤ/2ℤ'] == '1', r
            assert 'réductible' in status(), status()
            return {'arrowKeys': True}
        self.case('irred-keyboard', keyboard)

        def buttons():
            self.open(page)
            reset = f"document.querySelector('{fig} [data-irred-reset]')"
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            pick('b', 0)
            assert rows()['Évaluation en 1'].endswith('= 2, soit 0 modulo 2'), rows()
            assert rows()['Racines dans ℤ/2ℤ'] == '1', rows()
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'false'
            pick('c', 0)
            assert rows()['Racines dans ℤ/2ℤ'] == '0 et 1', rows()
            d.js(reset + '.click();')
            assert 'est irréductible' in status(), status()
            assert d.js('return ' + reset + ".getAttribute('aria-disabled');") == 'true'
            return {'reset': True}
        self.case('irred-buttons', buttons)
```

## 5. Emplacement dans `src/content/lessons/irreductibilite-polynomes.mdx`

Dans la section « Exploration », après la phrase exacte : « Ces questions appellent une preuve : tester quelques valeurs ne suffit pas à exclure toutes les racines possibles. » (avant `</CourseSection>`).

## 6. Choix de lecture

- Spécification muette sur les commandes : trois groupes de boutons radio natifs (degré 2/3, b 0/1, c 0/1), plage finie de 8 polynômes, plus un bouton « Remettre les valeurs initiales » (`aria-disabled` aux valeurs initiales). Le tableau récapitulatif des 8 polynômes est rendu à la compilation ; la ligne courante porte `aria-current`.
- Les évaluations se font modulo 2 : P(x) = x^d + b·x + c, détaillé (« 1² + 1 × 1 + 1 = 3, soit 1 modulo 2 »).
- La conclusion cite « le théorème 1 de la leçon » (numéro et critère en degrés 2 et 3 lus dans la leçon) sans l'énoncer ; elle conclut « réductible » dès qu'il y a une racine et « irréductible » sinon. Une note rappelle que la conclusion dépend du degré (la leçon traite les degrés 2 et 3 ; en degré 4 l'absence de racine ne suffirait plus, renvoi à la remarque de la leçon).
- Texte « deux valeurs épuisent le corps » reprise de la solution de l'exercice 2 de la leçon.
- Les valeurs des polynômes de degrés 2 et 3 coïncident pour les mêmes b et c (x² = x³ = x sur {0, 1}) : la figure ne le commente pas, le tableau le montre.

## 7. Ligne du gabarit (`docs/GABARIT-LECON.md`)

```
| `IrreducibleFigure` | `number` | figure de la leçon 15 : polynômes X² + bX + c et X³ + bX + c sur ℤ/2ℤ (degré 2 ou 3, b et c égaux à 0 ou 1), évaluations en 0 et 1, racines, conclusion d'irréductibilité, tableau des 8 polynômes ; calcul modulo 2, lecture textuelle et tableau rendus à la compilation |
```
