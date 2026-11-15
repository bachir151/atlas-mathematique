// SVG markup of the two figures of « Suites géométriques & sommes infinies »:
// discrete graphs (points (n, value), never joined by a curve), the limit line
// and, for figure 1, the open band (L − ε, L + ε). Only computed numbers reach
// the markup.
import { approxNumber, toNumber } from './rational.ts';
import type { IterationReading, SumReading } from './series.ts';

export const WIDTH = 400;
export const HEIGHT = 300;
const LEFT = 54, RIGHT = 16, BOTTOM = 36;

const round = (value: number) => Math.round(value * 100) / 100;

function niceStep(range: number, target: number): number {
  const raw = range / target;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / magnitude;
  return (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * magnitude;
}

interface ChartPoint { k: number; y: number; cls: string }
interface ChartSpec {
  top: number;
  xMax: number;
  points: ChartPoint[];
  /** Index in `points` of the current point, drawn with a ring. */
  current: number;
  line: { y: number; label: string };
  band?: { lo: number; hi: number };
  yLabel: string;
}

function chart(spec: ChartSpec): string {
  const values = [...spec.points.map(p => p.y), spec.line.y, ...(spec.band ? [spec.band.lo, spec.band.hi] : [])];
  let lo = Math.min(...values), hi = Math.max(...values);
  if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.08;
  lo -= pad; hi += pad;
  const plotW = WIDTH - LEFT - RIGHT, plotH = HEIGHT - spec.top - BOTTOM;
  const sx = (k: number) => round(LEFT + (k / spec.xMax) * plotW);
  const sy = (y: number) => round(spec.top + (hi - y) / (hi - lo) * plotH);
  const parts: string[] = [];

  // Grid and graduations.
  const yStep = niceStep(hi - lo, 5);
  for (let t = Math.ceil(lo / yStep); t * yStep <= hi; t++) {
    const value = Number((t * yStep).toPrecision(10));
    const y = sy(value);
    parts.push(`<line class="${value === 0 ? 'fig-axis' : 'fig-grid'}" x1="${LEFT}" y1="${y}" x2="${WIDTH - RIGHT}" y2="${y}"/>`);
    parts.push(`<text class="fig-tick" x="${LEFT - 6}" y="${y + 4}" text-anchor="end">${approxNumber(value)}</text>`);
  }
  const xStep = spec.xMax <= 10 ? 1 : spec.xMax <= 40 ? 5 : 10;
  for (let k = 0; k <= spec.xMax; k += xStep) {
    const x = sx(k);
    parts.push(`<line class="fig-grid" x1="${x}" y1="${spec.top}" x2="${x}" y2="${HEIGHT - BOTTOM}"/>`);
    const odd = (k / xStep) % 2 === 1 ? ' fig-tick-odd' : '';
    parts.push(`<text class="fig-tick${odd}" x="${x}" y="${HEIGHT - BOTTOM + 17}" text-anchor="middle">${k}</text>`);
  }
  parts.push(`<text class="fig-axis-title" x="${WIDTH - RIGHT}" y="${HEIGHT - 4}" text-anchor="end">rang n</text>`);
  parts.push(`<text class="fig-axis-title" x="${LEFT}" y="${spec.top - 6}" text-anchor="start">${spec.yLabel}</text>`);
  const grid = `<g aria-hidden="true">${parts.join('')}</g>`;

  const body: string[] = [];
  if (spec.band) {
    const yTop = sy(spec.band.hi), yBottom = sy(spec.band.lo);
    // At least one pixel high so that a very narrow band stays visible.
    const h = Math.max(1, round(yBottom - yTop));
    body.push(`<rect class="fig-band" x="${LEFT}" y="${round((yTop + yBottom - h) / 2)}" width="${WIDTH - LEFT - RIGHT}" height="${h}"/>`);
  }
  const yLine = sy(spec.line.y);
  body.push(`<line class="fig-limit" x1="${LEFT}" y1="${yLine}" x2="${WIDTH - RIGHT}" y2="${yLine}"/>`);
  body.push(`<text class="fig-line-label" x="${WIDTH - RIGHT - 4}" y="${yLine - 7}" text-anchor="end">${spec.line.label}</text>`);
  const r = spec.points.length <= 21 ? 5 : spec.points.length <= 41 ? 3.5 : 2.5;
  spec.points.forEach((p, i) => {
    const x = sx(p.k), y = sy(p.y);
    if (i === spec.current) body.push(`<circle class="fig-current-ring" cx="${x}" cy="${y}" r="${r + 5}"/>`);
    body.push(`<circle class="fig-dot ${p.cls}" cx="${x}" cy="${y}" r="${r}"/>`);
  });
  return `${grid}<g>${body.join('')}</g>`;
}

/** Unit segment cut into the pieces 1/2, 1/4, …: only for the halves preset. */
function strip(reading: SumReading): string {
  const x0 = LEFT, width = WIDTH - LEFT - RIGHT, y = 26, h = 18;
  const parts: string[] = [`<text class="fig-axis-title" x="${x0}" y="${y - 8}">${reading.sums.length} morceau${reading.sums.length > 1 ? 'x' : ''} du segment [0, 1]</text>`];
  let start = 0;
  reading.sums.forEach((sum, k) => {
    const end = toNumber(sum);
    const w = (end - start) * width;
    if (w >= 0.4) parts.push(`<rect class="fig-piece ${k % 2 ? 'fig-piece-odd' : ''}" x="${round(x0 + start * width)}" y="${y}" width="${round(w)}" height="${h}"/>`);
    start = end;
  });
  const rest = (1 - start) * width;
  parts.push(`<rect class="fig-rest" x="${round(x0 + start * width)}" y="${y}" width="${round(Math.max(rest, 0))}" height="${h}"/>`);
  parts.push(`<text class="fig-tick" x="${x0}" y="${y + h + 14}" text-anchor="middle">0</text>`);
  parts.push(`<text class="fig-tick" x="${x0 + width}" y="${y + h + 14}" text-anchor="middle">1</text>`);
  return `<g aria-hidden="true">${parts.join('')}</g>`;
}

export function sumSvg(reading: SumReading): string {
  const N = reading.sums.length - 1;
  const L = toNumber(reading.limit), eps = toNumber(reading.epsilon);
  const top = reading.halves ? 88 : 24;
  return (reading.halves ? strip(reading) : '') + chart({
    top,
    xMax: Math.max(N, 8),
    points: reading.sums.map((s, k) => ({ k, y: toNumber(s), cls: reading.inBand[k] ? 'fig-dot-in' : 'fig-dot-out' })),
    current: N,
    line: { y: L, label: 'L' },
    band: { lo: L - eps, hi: L + eps },
    yLabel: 'Sₙ',
  });
}

export function iterationSvg(reading: IterationReading): string {
  const n = reading.positions.length - 1;
  return chart({
    top: 24,
    xMax: Math.max(n, 8),
    points: reading.positions.map((x, k) => ({ k, y: toNumber(x), cls: 'fig-dot-in' })),
    current: n,
    line: { y: toNumber(reading.fixedPoint), label: 'p' },
    yLabel: 'xₙ',
  });
}
