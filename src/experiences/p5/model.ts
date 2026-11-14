import type { ExperienceApproval, Viewport } from './types.ts';

export const FRAME_MS = 1000 / 30;

/** Timing and layout only: these functions do not depend on p5 or the DOM. */
export function advanceTime(timeMs: number, deltaMs: number): number {
  if (!Number.isFinite(timeMs) || timeMs < 0 || !Number.isFinite(deltaMs)) throw new RangeError('Horloge invalide');
  return timeMs + Math.max(0, Math.min(deltaMs, 100));
}

export function resolveViewport(width: number): Viewport {
  const safeWidth = Number.isFinite(width) ? Math.max(160, Math.min(Math.floor(width), 960)) : 320;
  return { width: safeWidth, height: 240 };
}

export function canEmbed(approval: ExperienceApproval, development: boolean): boolean {
  if (approval.kind === 'technical') return true;
  if (approval.status === 'validated') return approval.reference.trim().length > 0;
  return development;
}

export function technicalBars(timeMs: number, viewport: Viewport) {
  if (!Number.isFinite(timeMs) || timeMs < 0) throw new RangeError('Horloge invalide');
  const count = 12;
  const gap = 6;
  const inset = 20;
  const width = (viewport.width - inset * 2 - gap * (count - 1)) / count;
  // A rendering test pattern, with no scientific or pedagogical interpretation.
  return Array.from({ length: count }, (_, index) => {
    const phase = ((timeMs / 1600 + index / count) % 1);
    const height = 24 + (1 - Math.abs(phase * 2 - 1)) * 140;
    return { x: inset + index * (width + gap), y: viewport.height - 24 - height, width, height };
  });
}
