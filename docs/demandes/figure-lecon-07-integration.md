# Figure leçon 07 — note d'intégration pour Claude

Fichiers prêts (non branchés) : `src/figures/quotient.ts`, `src/figures/quotient-svg.ts`, `src/components/figures/QuotientFigure.astro`, `src/scripts/quotient-figures.ts`, `src/styles/figures-quotient.css`, `tests/quotient.test.mjs` (9 tests node : réussis).

## 1. Balise MDX

```mdx
<QuotientFigure number="1" />
```

## 2. Emplacement dans `src/content/lessons/groupes-quotients.mdx`

La réponse de Codex ne donne pas d'emplacement précis (« Place proposée » désigne la place de la leçon dans le parcours). Proposition : dans la section « Des éléments aux classes », juste après l'exemple « Additionner les restes modulo quatre », c'est-à-dire après la phrase « … ceux-ci sont des représentants pratiques. » et son `</Example>`, avant `<Example name="Un sous-groupe qui ne convient pas">`. La direction peut préférer la fin de la section `exploration`.

## 3. Lignes à ajouter

`src/components/lesson/index.ts` :
```ts
import QuotientFigure from '../figures/QuotientFigure.astro';
// … et dans lessonComponents, après StepsFigure :
  …, StepsFigure, QuotientFigure,
```

`docs/GABARIT-LECON.md` (tableau des composants, après la ligne `<StepsFigure>`) :
```
| `<QuotientFigure>` | `number` | classes modulo n de la leçon 07 (n de 2 à 8, représentants a, b de −20 à 20, changements ±n), restes, classes, reste de a + b, table complète des sommes de classes ; calcul en entiers, lecture textuelle et table rendues à la compilation |
```

`package.json`, script `test:figures` : ajouter à la fin
```
 && node --experimental-strip-types tests/quotient.test.mjs
```

`scripts/check-build.mjs` (après le bloc `sous-groupes-entiers`) :
```js
    if (page.includes('groupes-quotients')) {
      assert.equal(doc.querySelectorAll('[data-quotient-figure]').length, 1, 'Une figure interactive');
      assert.match(doc.querySelector('[data-quotient-status]').textContent, /Cas courant dans ℤ\/4ℤ : \[1\] \+ \[2\] = \[3\]/, 'Lecture textuelle de la figure sans JavaScript');
      assert.equal(doc.querySelectorAll('[data-quotient-table] tr').length, 4, 'Table des sommes de classes présente');
      assert.equal(doc.querySelectorAll('[data-quotient-head] th[scope="col"]').length, 5, 'En-têtes de colonnes');
      assert.equal(doc.querySelectorAll('[data-quotient-table] th[scope="row"]').length, 4, 'En-têtes de lignes');
    }
```

`tests/browser_site.py` : ajouter `'quotient-static', 'quotient-keyboard', 'quotient-buttons'` aux deux listes de scénarios (lignes ~38 et ~43, après `'steps-buttons'`), appeler `checks.quotient()` à côté de `checks.steps()` (lignes ~805 et ~813), et ajouter la méthode (page `/cours/groupes-quotients/`, figure `#figure-quotient`) :

```python
    # ---------- Quotient figure (lesson « Groupes quotients & classes ») ----------
    def quotient(self):
        d = self.d
        page = '/cours/groupes-quotients/'
        fig = '#figure-quotient'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-quotient-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-quotient-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-action={name}]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Cas courant dans ℤ/4ℤ : [1] + [2] = [3]', 'elle ne démontre rien'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              classes:f.querySelectorAll('svg .fig-class').length,
              rowHeads:f.querySelectorAll('[data-quotient-table] th[scope=row]').length,
              colHeads:f.querySelectorAll('[data-quotient-head] th[scope=col]').length,
              current:f.querySelector('[data-quotient-table] td[aria-current=true]').textContent}};""")
            assert state['enabled'], state
            assert state['classes'] == 4 and state['rowHeads'] == 4 and state['colHeads'] == 5, state
            assert state['current'] == '[3]', state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'classes': state['classes']}
        self.case('quotient-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-param=n]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow up: n = 5
            r = rows()
            assert r['Modulo n'].startswith('n = 5 : 5 classes'), r
            assert r['Somme des classes'].startswith('[1] + [2] = [3]'), r
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-param=a]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key(''); time.sleep(0.1)
            a = d.js(f"return document.querySelector('{fig} [data-param=a]').value;")
            assert a == '20' and rows()['Représentants'] == 'a = 20 ; b = 2', (a, rows())
            return {'arrowKeys': True, 'clamped': a}
        self.case('quotient-keyboard', keyboard)

        def buttons():
            self.open(page)
            up = f"document.querySelector('{fig} [data-action=a-up]')"
            d.js(up + ".focus();")
            for _ in range(7):
                d.key('')  # Enter: 1 + 4k, stops at 17 (21 is out of bounds)
            time.sleep(0.1)
            assert rows()['Représentants'] == 'a = 17 ; b = 2', rows()
            assert d.js('return ' + up + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {up};"), 'Le focus doit rester sur le bouton indisponible'
            assert rows()['Classe de a'] == '[17] = [1] = 1 + 4ℤ', rows()
            action('b-down'); action('b-down'); action('b-down')
            assert rows()['Représentants'] == 'a = 17 ; b = −10', rows()
            assert rows()['Reste de b'] == '−10 = (−3) × 4 + 2', rows()
            assert rows()['Somme des classes'].startswith('[1] + [2] = [3]'), rows()
            action('reset')
            assert rows()['Représentants'] == 'a = 1 ; b = 2', rows()
            set_field('n', '8'); set_field('a', '-20'); set_field('b', '-20')
            assert rows()['Reste de a + b'] == '−40 = (−5) × 8 + 0', rows()
            assert d.js(f"return document.querySelector('{fig} [data-action=a-down]').getAttribute('aria-disabled');") == 'true'
            return {'bound': True, 'reset': True}
        self.case('quotient-buttons', buttons)
```
