/** Deliberately small public p5 surface used by the 2D adapter, not a global sketch. */
export interface P5Surface {
  setup: () => void;
  draw: () => void;
  deltaTime: number;
  noLoop(): void;
  loop(): void;
  redraw(): void | Promise<void>;
  remove(): void | Promise<void>;
  pixelDensity(value: number): void;
  frameRate(value: number): void;
  createCanvas(width: number, height: number): { elt: HTMLCanvasElement };
  resizeCanvas(width: number, height: number, noRedraw?: boolean): void;
  background(color: string): void;
  fill(color: string): void;
  noStroke(): void;
  rect(x: number, y: number, width: number, height: number, radius?: number): void;
}

export interface P5Constructor {
  new(sketch: (surface: P5Surface) => void, parent: HTMLElement): P5Surface;
}

export interface Viewport { width: number; height: number }
export interface SketchRenderer {
  draw(timeMs: number, viewport: Readonly<Viewport>): void;
  dispose?(): void;
}
export type SketchFactory = (surface: P5Surface, tone: 'sage' | 'clay') => SketchRenderer;

export type ExperienceApproval =
  | { kind: 'technical'; status: 'prototype' }
  | { kind: 'mathematical'; status: 'pending' }
  | { kind: 'mathematical'; status: 'validated'; reference: string };

export interface ExperienceDefinition {
  title: string;
  approval: ExperienceApproval;
}

export interface ManagedInstance {
  setRunning(value: boolean): void;
  resize(viewport: Viewport): void;
  step(): void;
  redraw(): void;
  destroy(): Promise<void>;
}
