# Intégration de la figure « cadran » (leçon 05) — note pour Claude

Fichiers prêts : `src/figures/cycle.ts`, `src/figures/cycle-svg.ts`, `src/components/figures/CycleFigure.astro`, `src/scripts/cycle-figures.ts`, `src/styles/figures-cycle.css`, `tests/cycle.test.mjs` (9 tests node, verts). Aucun fichier partagé n'a été modifié ; build et Firefox non lancés.

## 1. Balise MDX

```mdx
<CycleFigure number="1" />
```

## 2. Emplacement dans `src/content/lessons/groupes-cycliques.mdx`

Section `exploration` (« Quand retrouve-t-on le point de départ ? »), juste après le paragraphe qui se termine par « Nous allons comprendre ce phénomène dans un groupe quelconque, fini ou infini. » (paragraphe commençant par « Le cadran représente les heures par les restes de 0 à 11 »), avant `</CourseSection>`. Codex ne fixe pas de position précise ; seul le plan place « Cadran et question » en tête. Le cadran est introduit à cet endroit : à confirmer par la direction.

## 3. Lignes à ajouter

`src/components/lesson/index.ts` :
```ts
import CycleFigure from '../figures/CycleFigure.astro';
// ... et dans lessonComponents : ... StepsFigure, CycleFigure,
```

`docs/GABARIT-LECON.md` (tableau des composants) :
```
| `<CycleFigure>` | `number` | cadran de la leçon 05 : n positions (n de 2 à 24, défaut 12), pas k (de −24 à 24, défaut 4), avancer / reculer / recommencer, nombre signé de pas, position (reste), historique de 48 gestes au plus avec troncature indiquée ; id `figure-cadran` |
```

`package.json` (script `test:figures`) : ajouter à la fin
```
 && node --experimental-strip-types tests/cycle.test.mjs
```

`scripts/check-build.mjs` (à côté des autres `if (page.includes(...))`) :
```js
if (page.includes('groupes-cycliques')) {
  assert.equal(doc.querySelectorAll('[data-cycle-figure]').length, 1, 'Une figure interactive');
  assert.match(doc.querySelector('[data-cycle-status]').textContent, /^Nombre signé de pas : 0 ; position : 0 \(0 × 4 = 0 = 0 × 12 \+ 0\)\./, 'Lecture textuelle de la figure sans JavaScript');
  assert.equal(doc.querySelectorAll('[data-cycle-table] tr').length, 1, 'Historique initial : ligne de départ');
}
```

`tests/browser_site.py` : ajouter `'cycle-static', 'cycle-keyboard', 'cycle-buttons'` aux deux listes de cas (après `steps-buttons`), appeler `checks.cycle()` aux deux endroits où `checks.steps()` est appelé, et ajouter la méthode :

```python
    # ---------- Cycle figure (lesson « Groupes cycliques ») ----------
    def cycle(self):
        d = self.d
        page = '/cours/groupes-cycliques/'
        fig = '#figure-cadran'
        status = lambda: d.js(f"return document.querySelector('{fig} [data-cycle-status]').textContent;")
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-cycle-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-action={name}]').click();")
        note = lambda: d.js(f"return document.querySelector('{fig} [data-cycle-note]').textContent;")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Nombre signé de pas : 0 ; position : 0', 'Plage finie : n entre 2 et 24', 'elle ne prouve rien', 'Historique complet : 0 geste sur 48 au plus.'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              dots:f.querySelectorAll('svg .fig-dot').length,
              table:f.querySelectorAll('[data-cycle-table] tr').length}};""")
            assert state['enabled'], state
            assert state['dots'] == 12 and state['table'] == 1, state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'dots': state['dots']}
        self.case('cycle-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-param=k]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow up: k = 5
            assert rows()['Dispositif'] == '12 positions numérotées de 0 à 11 ; pas k = 5', rows()
            d.js(f"document.querySelector('{fig} [data-param=n]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow down: n = 11
            assert rows()['Dispositif'] == '11 positions numérotées de 0 à 10 ; pas k = 5', rows()
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-param=k]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key(''); time.sleep(0.1)
            k = d.js(f"return document.querySelector('{fig} [data-param=k]').value;")
            assert k == '24' and rows()['Dispositif'].endswith('pas k = 24'), (k, rows())
            return {'arrowKeys': True, 'clamped': k}
        self.case('cycle-keyboard', keyboard)

        def buttons():
            self.open(page)
            fwd = f"document.querySelector('{fig} [data-action=forward]')"
            d.js(fwd + ".focus();")
            for _ in range(3):
                d.key('')  # Enter: three gestures forward
            time.sleep(0.1)
            r = rows()
            assert r['Nombre signé de pas'] == '3' and r['Calcul'] == '3 × 4 = 12 = 1 × 12 + 0', r
            assert r['Position (reste entre 0 et 11)'] == '0', r
            assert d.js(f"return document.querySelectorAll('{fig} [data-cycle-table] tr').length;") == 4
            action('backward'); action('backward'); action('backward'); action('backward')
            r = rows()
            assert r['Nombre signé de pas'] == '−1' and r['Calcul'] == '(−1) × 4 = −4 = (−1) × 12 + 8', r
            assert d.js(f"return document.activeElement === {fwd};"), 'Le focus doit rester sur le bouton'
            action('reset')
            assert rows()['Nombre signé de pas'] == '0'
            assert d.js(f"return document.querySelector('{fig} [data-action=reset]').getAttribute('aria-disabled');") == 'true'
            set_field('k', '0'); action('forward')
            assert rows()['Position (reste entre 0 et 11)'] == '0', rows()
            action('reset'); set_field('k', '2')
            for _ in range(49):
                action('forward')
            assert note() == 'Historique tronqué : seuls les 48 premiers gestes sur 49 sont listés.', note()
            assert d.js(f"return document.querySelectorAll('{fig} [data-cycle-table] tr').length;") == 49
            assert 'elle ne prouve rien' in status(), status()
            return {'history': 48, 'truncated': True}
        self.case('cycle-buttons', buttons)
```
