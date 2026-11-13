/** Technical animation state. No group axioms or pedagogical assertions. */
export function normalizeAngle(angle: number): number {
  if (!Number.isFinite(angle)) throw new RangeError('Angle non fini');
  return ((angle % 360) + 360) % 360;
}

export function rotate(current: number, delta: number): number {
  return normalizeAngle(normalizeAngle(current) + normalizeAngle(delta));
}
