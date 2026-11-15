// One entry point per figure, shared by the build-time rendering
// (SeriesFigure.astro) and the browser controller (scripts/series-figures.ts).
import {
  affineIteration, geometricSum, ITERATION_LIMITS, ITERATION_MAX_RANK, ITERATION_PRESETS, ITERATION_SCALE,
  SUM_LIMITS, SUM_PRESETS, SUM_SCALE, type IterationState, type SumState,
} from './series.ts';
import { iterationSvg, sumSvg } from './series-svg.ts';
import { iterationText, sumText, type SeriesFigureText } from './series-text.ts';

export type SeriesKind = 'somme-geometrique' | 'iteration-affine';
export type SeriesState = Record<string, number>;

export interface SeriesView extends SeriesFigureText {
  svg: string;
  /** Actions currently unavailable (aria-disabled). */
  disabled: string[];
}

export interface FieldSpec { name: string; label: string; scale: number; min: number; max: number }

export interface SeriesModel {
  preset: () => SeriesState;
  fields: FieldSpec[];
  view: (state: SeriesState) => SeriesView;
  /** Change of a parameter; the iteration starts again from rank 0. */
  set: (state: SeriesState, name: string, value: number) => SeriesState;
  action: (state: SeriesState, name: string) => SeriesState;
}

const field = (name: string, label: string, scale: number, [min, max]: readonly [number, number]): FieldSpec => ({ name, label, scale, min, max });

const sumModel: SeriesModel = {
  preset: () => ({ ...SUM_PRESETS.halves }),
  fields: [
    field('a', 'Premier terme a', SUM_SCALE.a, SUM_LIMITS.a),
    field('q', 'Raison q', SUM_SCALE.q, SUM_LIMITS.q),
    field('N', 'Rang N', SUM_SCALE.N, SUM_LIMITS.N),
  ],
  view: state => {
    const reading = geometricSum(state as unknown as SumState);
    const text = sumText(state as unknown as SumState, reading);
    const disabled = reading.firstRank === undefined || reading.firstRank === state.N ? ['first-rank'] : [];
    return { ...text, svg: sumSvg(reading), disabled };
  },
  set: (state, name, value) => ({ ...state, [name]: value }),
  action: (state, name) => {
    if (name === 'first-rank') {
      const rank = geometricSum(state as unknown as SumState).firstRank;
      return rank === undefined ? state : { ...state, N: rank };
    }
    if (name === 'preset-alternating') return { ...SUM_PRESETS.alternating };
    return { ...SUM_PRESETS.halves };
  },
};

const iterationModel: SeriesModel = {
  preset: () => ({ ...ITERATION_PRESETS.average }),
  fields: [
    field('q', 'Raison q', ITERATION_SCALE.q, ITERATION_LIMITS.q),
    field('b', 'Constante b', ITERATION_SCALE.b, ITERATION_LIMITS.b),
    field('x0', 'Position initiale x₀', ITERATION_SCALE.x0, ITERATION_LIMITS.x0),
  ],
  view: state => {
    const reading = affineIteration(state as unknown as IterationState);
    const text = iterationText(state as unknown as IterationState, reading);
    const disabled = [...(state.n >= ITERATION_MAX_RANK ? ['next'] : []), ...(state.n === 0 ? ['reset'] : [])];
    return { ...text, svg: iterationSvg(reading), disabled };
  },
  set: (state, name, value) => ({ ...state, [name]: value, n: 0 }),
  action: (state, name) => {
    if (name === 'next') return { ...state, n: Math.min(ITERATION_MAX_RANK, state.n + 1) };
    if (name === 'reset') return { ...state, n: 0 };
    if (name === 'preset-alternating') return { ...ITERATION_PRESETS.alternating };
    return { ...ITERATION_PRESETS.average };
  },
};

export const seriesModels: Record<SeriesKind, SeriesModel> = {
  'somme-geometrique': sumModel,
  'iteration-affine': iterationModel,
};
