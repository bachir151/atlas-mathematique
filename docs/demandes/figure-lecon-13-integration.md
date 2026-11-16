# Intégration de la figure de la leçon 13 « Anneaux quotients & morphismes »

Figure `rquot` : composant `RingQuotientFigure`, id `figure-anneau-quotient`, attributs `data-rquot-*`. Source de la spécification : paragraphe « Interaction proposée, après validation » de `docs/demandes/codex-lecon-13-anneaux-quotients-reponse.md`. Test : `node --experimental-strip-types tests/rquot.test.mjs` (9 tests, tous réussis).

## Balise MDX

```mdx
<RingQuotientFigure number="1" />
```

## Import (pour information)

```ts
import RingQuotientFigure from '../figures/RingQuotientFigure.astro';
```

## Bloc de `scripts/check-build.mjs`

```js
    if (page.includes('anneaux-quotients-morphismes')) {
      assert.equal(doc.querySelectorAll('[data-rquot-figure]').length, 1, 'Une figure interactive');
      assert.match(doc.querySelector('[data-rquot-status]').textContent, /Cas courant dans ℤ\/4ℤ : \[1\] \+ \[2\] = \[3\] et \[1\] × \[2\] = \[2\]/, 'Lecture textuelle de la figure sans JavaScript');
      assert.match(doc.querySelector('[data-rquot-status]').textContent, /ne démontre rien/, 'Plage finie et caractère exploratoire annoncés');
      assert.equal(doc.querySelectorAll('[data-rquot-table="add"] tr').length, 4, 'Table complète d’addition présente');
      assert.equal(doc.querySelectorAll('[data-rquot-table="mul"] tr').length, 4, 'Table complète de multiplication présente');
      assert.equal(doc.querySelectorAll('[data-rquot-head] th[scope="col"]').length, 10, 'En-têtes de colonnes des deux tables');
      assert.equal(doc.querySelectorAll('[data-rquot-table] th[scope="row"]').length, 8, 'En-têtes de lignes des deux tables');
    }
```

## Scénarios navigateur

```python
    def rquot(self):
        d = self.d
        page = '/cours/anneaux-quotients-morphismes/'
        fig = '#figure-anneau-quotient'
        rows = lambda: d.js(f"return Object.fromEntries([...document.querySelectorAll('{fig} [data-rquot-rows] > div')].map(r=>[r.children[0].textContent,r.children[1].textContent]));")
        set_field = lambda name, value: d.js(f"const f=document.querySelector('{fig} [data-rquot-param={name}]');f.value='{value}';f.dispatchEvent(new Event('input'));")
        action = lambda name: d.js(f"document.querySelector('{fig} [data-rquot-action={name}]').click();")

        def static():
            html = (self.root / page.strip('/') / 'index.html').read_text(encoding='utf-8')
            for expected in ('Cas courant dans ℤ/4ℤ : [1] + [2] = [3] et [1] × [2] = [2]', 'elle ne démontre rien'):
                assert expected in html, f'Texte initial absent du HTML compilé : {expected}'
            self.open(page)
            state = d.js(f"""const f=document.querySelector('{fig}');return {{
              enabled:[...f.querySelectorAll('input,button')].every(e=>!e.disabled),
              label:f.querySelector('svg').getAttribute('aria-labelledby'),
              classes:f.querySelectorAll('svg .rquot-class').length,
              addRows:f.querySelectorAll('[data-rquot-table=add] th[scope=row]').length,
              mulRows:f.querySelectorAll('[data-rquot-table=mul] th[scope=row]').length,
              addCurrent:f.querySelector('[data-rquot-table=add] td[aria-current=true]').textContent,
              mulCurrent:f.querySelector('[data-rquot-table=mul] td[aria-current=true]').textContent}};""")
            assert state['enabled'], state
            assert state['classes'] == 4 and state['addRows'] == 4 and state['mulRows'] == 4, state
            assert state['addCurrent'] == '[3]' and state['mulCurrent'] == '[2]', state
            assert all(d.js('return !!document.getElementById(arguments[0]);', ref) for ref in state['label'].split()), state
            return {'classes': state['classes']}
        self.case('rquot-static', static)

        def keyboard():
            self.open(page)
            d.js(f"document.querySelector('{fig} [data-rquot-param=n]').focus();")
            d.key(''); time.sleep(0.1)  # Arrow up: n = 5
            r = rows()
            assert r['Modulo n'].startswith('n = 5 : 5 classes'), r
            assert r['Produit des classes'].startswith('[1] × [2] = [2]'), r
            assert r['Produits nuls'].startswith('aucun produit'), r
            # Out-of-range values are clamped when the field is left.
            d.js(f"const f=document.querySelector('{fig} [data-rquot-param=a]');f.focus();f.select();")
            for ch in '99':
                d.key(ch)
            d.key(''); time.sleep(0.1)
            a = d.js(f"return document.querySelector('{fig} [data-rquot-param=a]').value;")
            assert a == '20' and rows()['Représentants'] == 'a = 20 ; b = 2', (a, rows())
            return {'arrowKeys': True, 'clamped': a}
        self.case('rquot-keyboard', keyboard)

        def buttons():
            self.open(page)
            up = f"document.querySelector('{fig} [data-rquot-action=a-up]')"
            d.js(up + ".focus();")
            for _ in range(7):
                d.key('')  # Enter: 1 + 4k, stops at 17 (21 is out of bounds)
            time.sleep(0.1)
            assert rows()['Représentants'] == 'a = 17 ; b = 2', rows()
            assert d.js('return ' + up + ".getAttribute('aria-disabled');") == 'true'
            assert d.js(f"return document.activeElement === {up};"), 'Le focus doit rester sur le bouton indisponible'
            action('b-down'); action('b-down'); action('b-down')
            assert rows()['Représentants'] == 'a = 17 ; b = −10', rows()
            assert rows()['Produit avant réduction'] == 'a × b = 17 × (−10) = −170', rows()
            assert rows()['Reste de ab'] == '−170 = (−43) × 4 + 2', rows()
            assert rows()['Produit des classes'].startswith('[1] × [2] = [2]'), rows()
            assert rows()['Produits nuls'].startswith('[2] × [2] = [0]'), rows()
            action('reset')
            assert rows()['Représentants'] == 'a = 1 ; b = 2', rows()
            set_field('n', '8'); set_field('a', '-20'); set_field('b', '-20')
            assert rows()['Reste de ab'] == '400 = 50 × 8 + 0', rows()
            assert d.js(f"return document.querySelector('{fig} [data-rquot-action=a-down]').getAttribute('aria-disabled');") == 'true'
            return {'bound': True, 'reset': True}
        self.case('rquot-buttons', buttons)
```

## Emplacement dans la leçon

À insérer dans l'exploration, juste après la phrase de Codex (fin de la deuxième phrase de calcul, avant « Essayez d'autres représentants. ») : « Ces résultats représentent encore la même classe, car leur différence est un multiple de $4$. » En pratique, la balise est mise après le paragraphe qui contient cette phrase et la question « Est-ce toujours vrai ? » (un composant ne peut pas s'insérer au milieu d'un paragraphe), c'est-à-dire avant le paragraphe « Ces calculs suggèrent une multiplication des classes… ». Le texte de la leçon n'est pas modifié.

## Choix de lecture

- Notation des classes : `[x]` (comme la figure de la leçon 07), la leçon utilisant `\overline` que le texte brut des lignes de lecture ne rend pas ; les règles de la leçon restent inchangées.
- « Calculs avant réduction » : sommes et produits entiers `a + b` et `a × b` (ex. `5 × (−2) = −10`), puis division euclidienne par n de chacun.
- « Comparer les produits nuls pour n = 4 et n = 5 » : une ligne de lecture « Produits nuls » liste, pour le n choisi, les couples de classes non nulles de produit [0] (n = 4 : `[2] × [2] = [0]` ; n = 5 : aucun), puis la table de multiplication permet de le voir. La figure n'énonce aucune propriété générale (ni sur la primalité ni sur les corps).
- Les deux tables (addition, multiplication) sont rendues à la compilation, avec la case du cas courant en `aria-current`. Le dessin montre les n classes en boîtes, repérant celles de a, b, a + b et ab ; aucune droite des entiers (le produit atteint 400).
- Alternative sans JavaScript : tables complètes pour n = 4 et lecture initiale `1 × 2 = 2` ; le cas `5 × (−2) = −10 ≡ 2` s'obtient avec a = 5, b = −2 (la leçon donne déjà ce calcul).
- Les commandes `a ± n`, `b ± n` sont indisponibles (`aria-disabled`) quand le résultat sortirait de [−20, 20].

## Ligne du gabarit

```
| `<RingQuotientFigure>` | `number` | classes modulo n de la leçon 13 (n de 2 à 8, représentants a, b de −20 à 20, changements ±n), restes, classes de a + b et de ab, calculs avant réduction, produits nuls, tables complètes d'addition et de multiplication ; calcul en entiers, lecture textuelle et tables rendues à la compilation |
```
