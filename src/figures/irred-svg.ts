// SVG of the figure « polynômes sur ℤ/2ℤ » : two cards, one for x = 0 and one
// for x = 1, with the value of P (a root is green, with a ring), and the
// verdict under them. Only computed integers and fixed words reach the markup.
import { polyName, type IrredReading } from './irred.ts';

export const WIDTH = 400;
export const HEIGHT = 170;

export function irredSvg(reading: IrredReading): string {
  const { state, values, raw, irreducible } = reading;
  const body: string[] = [];
  body.push(`<text class="fig-label irred-title" x="${WIDTH / 2}" y="24" text-anchor="middle">${polyName(state)}</text>`);
  const cardW = 150, cardH = 74, y = 40;
  [0, 1].forEach(x => {
    const left = x === 0 ? 30 : WIDTH - 30 - cardW;
    const root = values[x] === 0;
    body.push(`<rect class="irred-card ${root ? 'irred-card-root' : 'irred-card-value'}" x="${left}" y="${y}" width="${cardW}" height="${cardH}" rx="4"/>`);
    body.push(`<text class="fig-axis-title" x="${left + cardW / 2}" y="${y + 18}" text-anchor="middle">en x = ${x}</text>`);
    body.push(`<text class="irred-value" x="${left + cardW / 2}" y="${y + 50}" text-anchor="middle">P(${x}) = ${values[x]}</text>`);
    body.push(`<text class="fig-axis-title" x="${left + cardW / 2}" y="${y + 67}" text-anchor="middle">${root ? 'racine' : 'pas une racine'}${raw[x] !== values[x] ? ` (${raw[x]} modulo 2)` : ''}</text>`);
  });
  body.push(`<text class="irred-verdict ${irreducible ? 'irred-verdict-yes' : 'irred-verdict-no'}" x="${WIDTH / 2}" y="152" text-anchor="middle">${irreducible ? 'irréductible' : 'réductible'} sur ℤ/2ℤ</text>`);
  return `<g>${body.join('')}</g>`;
}
