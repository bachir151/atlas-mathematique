import { technicalBars } from '../model.ts';
import type { SketchFactory } from '../types.ts';

export const createSketch: SketchFactory = (surface, tone) => ({
  draw(timeMs, viewport) {
    const bars = technicalBars(timeMs, viewport);
    surface.background('#f0f2e9');
    surface.noStroke();
    bars.forEach((bar, index) => {
      surface.fill(index % 3 === 0 ? '#a35b35' : tone === 'clay' ? '#8c6c46' : '#294c3d');
      surface.rect(bar.x, bar.y, bar.width, bar.height, 3);
    });
  },
});
