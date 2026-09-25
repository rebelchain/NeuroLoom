export const CAMERA_Z = 16;
export const FOV_DEGREES = 50;
export const MARK_HALF_EXTENT = 4.5;

const GATE_SHARE = 0.62;
const GATE_INSET = 0.04;

export interface Gate {
  side: number;
  height: number;
  topY: number;
  apexY: number;
  incircleRadius: number;
  incircleCenterY: number;
}


export function gateCorners(inset = 0): { x: number; y: number }[] {
  const gate = gateShape();
  const centroidY = gate.incircleCenterY;
  const raw = [
    { x: -gate.side / 2, y: gate.topY },
    { x: gate.side / 2, y: gate.topY },
    { x: 0, y: gate.apexY },
  ];
  if (inset === 0) return raw;
  const keep = 1 - inset;
  return raw.map((c) => ({ x: c.x * keep, y: centroidY + (c.y - centroidY) * keep }));
}

export function insideGate(x: number, y: number, inset = GATE_INSET): boolean {
  const corners = gateCorners(inset);
  let hit = false;
  for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
    const a = corners[i];
    const b = corners[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}


function closestOnSegment(
  x: number,
  y: number,
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / lengthSq));
  return { x: a.x + t * dx, y: a.y + t * dy };
}


export function clampIntoGate(x: number, y: number, inset = GATE_INSET) {
  if (insideGate(x, y, inset)) return { x, y };
  const corners = gateCorners(inset);
  let best = { x, y };
  let bestDistance = Infinity;
  for (let i = 0; i < corners.length; i++) {
    const point = closestOnSegment(x, y, corners[i], corners[(i + 1) % corners.length]);
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = point;
    }
  }

  const centroidY = gateShape().incircleCenterY;
  return {
    x: best.x * 0.999,
    y: centroidY + (best.y - centroidY) * 0.999,
  };
}

export function gateShape(): Gate {
  const visibleHeight = 2 * Math.tan((FOV_DEGREES / 2) * (Math.PI / 180)) * CAMERA_Z;
  const height = visibleHeight * GATE_SHARE;
  const side = (2 * height) / Math.sqrt(3);
  return {
    side,
    height,
    topY: height / 2,
    apexY: -height / 2,
    incircleRadius: height / 3,
    incircleCenterY: height / 6,
  };
}

export function textColumnHalfWidth(viewportWidth: number): number {
  return Math.min(768, viewportWidth - 64) / 2;
}

export function pixelsPerWorldUnit(viewportHeight: number, positionZ: number): number {
  const depth = CAMERA_Z - positionZ;
  const visibleHeight = 2 * Math.tan((FOV_DEGREES / 2) * (Math.PI / 180)) * depth;
  return viewportHeight / visibleHeight;
}

export interface FieldInput {
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
  docHeight: number;
  pointer?: { x: number; y: number };
}

export interface FieldState {
  positionX: number;
  positionZ: number;
  scale: number;
  rotationY: number;
  rotationX: number;
  opacity: number;
  scatter: number;
  doorOpacity: number;
  doorScale: number;
  starfieldOpacity: number;
  markOffsetX: number;
  markOffsetY: number;
  pointerWorldX: number;
  pointerWorldY: number;
  pointerPresent: boolean;
  depthRatio: number;
  installDock: number;
  markForm: number;
  markLife: number;
  proseFrom: number;
  outroFrom: number;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function clearanceWorld(viewportWidth: number, viewportHeight: number, scale: number, positionZ: number) {
  const perUnit = pixelsPerWorldUnit(viewportHeight, positionZ);
  const halfExtentPx = MARK_HALF_EXTENT * scale * perUnit;
  const neededPx = textColumnHalfWidth(viewportWidth) + halfExtentPx + 24;
  return { neededWorld: neededPx / perUnit, neededPx, halfExtentPx };
}

export function fieldState({
  scrollY,
  viewportWidth,
  viewportHeight,
  docHeight,
  pointer,
}: FieldInput): FieldState {
  const proseFrom = viewportHeight * 2.2;
  const outroFrom = docHeight - viewportHeight * 2.1;

  const traverse = clamp(scrollY / (viewportHeight * 1.5), 0, 1);
  const eased = easeOut(traverse);
  const markForm = easeOut(clamp(scrollY / (viewportHeight * 1.25), 0, 1));

  const markLife = 0.18 + 0.82 * easeOut(clamp((scrollY - viewportHeight * 0.75) / (viewportHeight * 0.85), 0, 1));

  const positionZ = -22 + 22 * eased;
  const scale = 0.5 + 0.5 * eased;
  const handoffFrom = viewportHeight * 1.65;
  const handoff = easeOut(clamp((scrollY - handoffFrom) / (proseFrom - handoffFrom), 0, 1));

  const { neededPx, halfExtentPx } = clearanceWorld(viewportWidth, viewportHeight, scale, positionZ);
  const perUnit = pixelsPerWorldUnit(viewportHeight, positionZ);

  const roomBeside = neededPx <= viewportWidth / 2 + halfExtentPx * 0.35;
  const restingOpacity = roomBeside ? 0.4 : 0.02;
  const offscreenWorld = (viewportWidth / 2 + halfExtentPx) / perUnit;
  const returning = easeOut(clamp((scrollY - outroFrom) / (viewportHeight * 0.8), 0, 1));
  const positionX =
    handoff * (roomBeside ? neededPx / perUnit : offscreenWorld) * (1 - returning);

  const past = clamp((scrollY - proseFrom) / (viewportHeight * 2), 0, 1);
  const scatter = easeOut(clamp((scrollY - outroFrom) / (viewportHeight * 1.4), 0, 1));


  const installDock = easeOut(clamp((scrollY - outroFrom) / (viewportHeight * 1.1), 0, 1));


  const arrival = 0.25 + 0.75 * eased;
  const yielded = 1 + (restingOpacity - 1) * handoff;
  const opacity = arrival * (yielded + (0.85 - yielded) * scatter);

 const through = easeOut(clamp(scrollY / (viewportHeight * 1.2), 0, 1));
 const doorOpacity = 1 - through;
 const doorScale = 1 + through * 1.4;

  const starfieldOpacity = 0.34 + 0.34 * eased;

  const held = 1 - through;
  const reach = Math.tan((FOV_DEGREES / 2) * (Math.PI / 180)) * CAMERA_Z;
  const pointerWorldX = pointer ? pointer.x * reach * (viewportWidth / viewportHeight) : 0;
  const pointerWorldY = pointer ? pointer.y * reach : 0;

  const depthRatio = (CAMERA_Z - positionZ) / CAMERA_Z;

  let markOffsetX = 0;
  let markOffsetY = 0;
  if (pointer && held > 0) {
    markOffsetX = pointerWorldX * depthRatio * held;
    markOffsetY = pointerWorldY * depthRatio * held;
  }

  return {
    positionX,
    positionZ,
    scale,
    rotationY: past * Math.PI * 0.9,
    rotationX: past * 0.2,
    opacity,
    scatter,
    doorOpacity,
    doorScale,
    starfieldOpacity,
    markOffsetX,
    markOffsetY,
    pointerWorldX,
    pointerWorldY,
    pointerPresent: !!pointer,
    depthRatio,
    installDock,
    markForm,
    markLife,
    proseFrom,
    outroFrom,
  };
}
