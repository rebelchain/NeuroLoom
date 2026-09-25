
export type FigureSide = "left" | "right" | null;

export interface Slot {
  readonly beside: boolean;

  readonly centreX: number;
  readonly centreY: number;
}

const EDGE = 24;

export function markSlot({
  side,
  viewportWidth,
  viewportHeight,
  halfExtentPx,
  figureCentreY,
}: {
  side: FigureSide;
  viewportWidth: number;
  viewportHeight: number;

  halfExtentPx: number;
  figureCentreY: number;
}): Slot {
  const half = viewportWidth / 2;
  const fits = side !== null && 2 * halfExtentPx + EDGE <= half;
  if (!fits) return { beside: false, centreX: half, centreY: viewportHeight / 2 };

  const wanted = side === "right" ? half / 2 : half + half / 2;
  const [low, high] = side === "right" ? [0, half] : [half, viewportWidth];
  const centreX = Math.max(low + halfExtentPx + EDGE, Math.min(high - halfExtentPx - EDGE, wanted));

  const centreY = Math.max(halfExtentPx * 0.5 + EDGE, Math.min(viewportHeight - halfExtentPx * 0.5 - EDGE, figureCentreY));

  return { beside: true, centreX, centreY };
}

/**
 * The figure the reader is actually looking at: the one whose middle is nearest the viewport's.
 *
 */
export function nearestFigure(): { side: FigureSide; centreY: number } {
  if (typeof document === "undefined") return { side: null, centreY: 0 };
  const middle = window.innerHeight / 2;
  let best: { side: FigureSide; centreY: number; distance: number } = { side: null, centreY: middle, distance: Infinity };

  for (const node of document.querySelectorAll<HTMLElement>("[data-figure-side]")) {
    const box = node.getBoundingClientRect();
    if (box.bottom < 0 || box.top > window.innerHeight) continue;
    const centreY = box.top + box.height / 2;
    const distance = Math.abs(centreY - middle);
    if (distance < best.distance) {
      const side = node.dataset.figureSide === "left" ? "left" : "right";
      best = { side, centreY, distance };
    }
  }
  return { side: best.side, centreY: best.centreY };
}
