# Figure leçon 11 — note d'intégration pour Claude

Fichiers prêts (non branchés) : `src/figures/ring.ts`, `src/figures/ring-svg.ts`, `src/components/figures/RingFigure.astro`, `src/scripts/ring-figures.ts`, `src/styles/figures-ring.css`, `tests/ring.test.mjs` (9 tests node : réussis).

## 1. Balise MDX

```mdx
<RingFigure number="1" />
```

## 2. Import du composant

```ts
import RingFigure from '../figures/RingFigure.astro';
```

## 3. Contrôle de build

```js
    if (page.includes('anneaux-corps')) {
      assert.equal(doc.querySelectorAll('[data-ring-figure]').length, 1, 'Une figure interactive');
      assert.match(doc.querySelector('[data-ring-status]').textContent, /Cas courant dans ℤ\/6ℤ : \[2\] × \[3\] = \[0\]/, 'Lecture textuelle de la figure sans JavaScript');
      assert.match(doc.querySelector('[data-ring-status]').textContent, /pour n de 2 à 12 : elle ne démontre aucun critère général/, 'Plage finie annoncée et caractère exploratoire');
      assert.equal(doc.querySelectorAll('[data-ring-table] tr').length, 6, 'Table de multiplication présente');
      assert.equal(doc.querySelectorAll('[data-ring-head] th[scope="col"]').length, 7, 'En-têtes de colonnes');
      assert.equal(doc.querySelectorAll('[data-ring-table] th[scope="row"]').length, 6, 'En-têtes de lignes');
    }
```

## 4. Scénarios navigateur

```python
    # ---------- Ring figure (lesson « Anneaux & corps ») ----------
    def ring(self):
        d = self.d
        page = '/cours/anneaux-corps/'
        fig = '#figure-anneau'
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-ring-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-ring-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-ring-action={name}]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Cas courant dans ℤ/6ℤ : [2] × [3] = [0]', 'ne démontre aucun critère général'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              cells:f.querySelectorAll('svg .ring-cell').length,
              rowHeads:f.querySelectorAll('[data-ring-table] th[scope=row]').length,
              colHeads:f.querySelectorAll('[data-ring-head] th[scope=col]').length,
              current:f.querySelector('[data-ring-table] td[aria-current=true]').textContent}};""")
            assert state['enabled'], state
            assert state['cells'] == 36 and state['rowHeads'] == 6 and state['colHeads'] == 7, state
            assert state['current'] == '[0]', state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'cells': state['cells']}
        self.case('ring-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-ring-param=a]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow up: a = 3
            r = rows()
            assert r['Produit des classes'] == '[3] × [3] = [3]', r
            d.js(f"document.querySelector('{fig} [data-ring-param=n]').focus();")
            for _ in range(3):
                d.key(''); time.sleep(0.1)  # Arrow down: n = 5, 4, 3
            r = rows()
            assert r['Modulo n'].startswith('n = 3 : 3 classes'), r
            assert r['Restes choisis'] == 'a = 0 ; b = 0', r  # 3 mod 3 = 0
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-ring-param=a]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key(''); time.sleep(0.1)
            a = d.js(f"return document.querySelector('{fig} [data-ring-param=a]').value;")
            assert a == '2' and rows()['Restes choisis'] == 'a = 2 ; b = 0', (a, rows())
            return {'arrowKeys': True, 'clamped': a}
        self.case('ring-keyboard', keyboard)

        def buttons():
            self.open(page)
            up = f"document.querySelector('{fig} [data-ring-action=n-up]')"
            d.js(up + ".focus();")
            for _ in range(7):
                d.key('')  # Enter: n = 7 … 12, stops at 12
            time.sleep(0.1)
            assert rows()['Modulo n'].startswith('n = 12 : 12 classes'), rows()
            assert d.js('return ' + up + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {up};"), 'Le focus doit rester sur le bouton indisponible'
            set_field('a', '11'); set_field('b', '8')
            assert rows()['Produit des classes'] == '[11] × [8] = [4]', rows()
            action('n-down')
            assert rows()['Restes choisis'] == 'a = 0 ; b = 8', rows()  # 11 mod 11 = 0
            action('reset')
            assert rows()['Restes choisis'] == 'a = 2 ; b = 3', rows()
            assert rows()['Modulo n'].startswith('n = 6 : 6 classes'), rows()
            set_field('n', '5')
            assert rows()['Produits nuls de facteurs non nuls'] == 'aucun couple de restes non nuls de produit nul modulo 5', rows()
            assert rows()['Inverse de a'].startswith('[2] a pour inverse [3]'), rows()
            return {'bound': True, 'reset': True}
        self.case('ring-buttons', buttons)
```

## 5. Emplacement et choix de lecture

Dans `src/content/lessons/anneaux-corps.mdx`, section « Exploration », juste après la phrase « La seconde équation a la solution $x=5$ ; la première n’en a aucune parmi les six restes. » (fin du premier paragraphe, avant « Ces essais suggèrent… »). Le paragraphe étant un bloc de texte, insérer la balise sur sa propre ligne, entre les deux paragraphes.

Choix de lecture (spécification muette) :
- Case sélectionnée : celle de la ligne a et de la colonne b (produit a × b), signalée par `aria-current="true"` dans le tableau et par un cadre dans le dessin ; saisie par les champs a et b (pas de clic sur les cases).
- a et b sont bornés à 0 … n − 1 (le champ se met à jour avec n) ; au changement de n (champ, boutons « n − 1 » / « n + 1 » ou réinitialisation), a et b sont remplacés par leurs restes modulo le nouveau n.
- Inversibles : tous les restes de 0 à n − 1 qui ont un inverse (donc [1] toujours, [0] jamais puisque n ≥ 2), avec leur inverse ; inverse de a et de b aussi indiqué séparément.
- Couples de facteurs non nuls de produit nul : couples non ordonnés i ≤ j parmi 1 … n − 1 (le produit est commutatif), donc [2] × [3] et [3] × [4] modulo 6 ; « aucun couple » sinon.
- Dessin : table colorée (orange = produit nul de deux restes non nuls, vert = produit égal à 1), ligne de a et colonne de b teintées ; le tableau HTML reste la lecture de référence. Aucun énoncé de critère général (pas de mention de « n premier »).

```
| `RingFigure` | `number` | table de multiplication modulo n de la leçon 11 (n de 2 à 12, restes a et b de 0 à n − 1, case sélectionnée), calcul en entiers, classes inversibles avec leur inverse, couples non nuls de produit nul ; lecture textuelle et tableau rendus à la compilation |
```
