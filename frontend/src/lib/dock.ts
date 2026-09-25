export const dockRect = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  on: false,
  hovered: false,
};

const ARRIVAL_LEAD = 110;

export interface DockPlacement {
  readonly y: number;
  readonly opacity: number;
}

let gapCentre: number | null = null;
let topEdge: number | null = null;

export function setDockTarget(centre: number, top: number): void {
  gapCentre = centre;
  topEdge = top;
}

export function clearDockTarget(): void {
  gapCentre = null;
  topEdge = null;
}

export function dockNow(footY: number, viewportHeight: number): DockPlacement {
  return dockPlacement({ footY, viewportHeight, gapCentre, topEdge });
}

export function dockPlacement({
  footY,
  viewportHeight,
  gapCentre,
  topEdge,
}: {
  footY: number;
  viewportHeight: number;
  gapCentre: number | null;
  topEdge: number | null;
}): DockPlacement {
  const gap =
    gapCentre !== null && Number.isFinite(gapCentre) ? gapCentre : null;
  const top = topEdge !== null && Number.isFinite(topEdge) ? topEdge : null;

  if (gap === null || top === null) return { y: footY, opacity: 1 };

  if (gap <= footY) return { y: gap, opacity: 1 };

  const travelled = (viewportHeight + ARRIVAL_LEAD - top) / ARRIVAL_LEAD;
  return { y: footY, opacity: Math.max(0, Math.min(1, 1 - travelled)) };
}

export interface Band {
  readonly top: number;
  readonly bottom: number;
}

const CLEARANCE = 120;

export function dockClearance(line: Band, content: readonly Band[]): number {
  let worst = 1;
  for (const box of content) {
    if (box.top < line.bottom && box.bottom > line.top) return 0;
    // The nearest edge, whichever side it is on, ramped over the clearance distance.
    const gap =
      box.top >= line.bottom ? box.top - line.bottom : line.top - box.bottom;
    if (gap < CLEARANCE) worst = Math.min(worst, Math.max(0, gap / CLEARANCE));
  }
  return worst;
}
