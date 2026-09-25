/**
 * The Zentis mark as a point cloud.
 *
 * The mark is three straight-edged shapes: two offset bars — the two chains —
 * and the diagonal connector between them. Every edge is a line, so the outline
 * can be walked by arc length directly instead of through a browser path API,
 * which keeps this file runnable and testable outside a DOM.
 *
 * Points are laid on the edges first, evenly, so the silhouette reads before
 * the fill does; the remainder is rejection-sampled inside the shapes.
 */

export interface Point {
  x: number;
  y: number;
}

/** The three shapes, in the mark's own 1000x1000 user space. */
export const BRIDGE =
  "M594 257L663.282 297L405.282 743.869L336 703.869L594 257Z";
export const CHAIN_A =
  "M999.999 636.737H727.272L272.727 818.555V727.646L727.272 545.828H999.999V636.737Z";
export const CHAIN_B =
  "M0 364.009L272.727 363.938L727.225 182L727.249 272.909L272.751 454.847L0.0239091 454.918L0 364.009Z";

const VIEWBOX = 1000;

/** Role tags carried alongside each point. */
export const BAR = 0;
export const BRIDGE_ROLE = 1;

/**
 * Turns one closed subpath into a ring of vertices. Handles the commands the
 * mark actually uses — M, L, H, V, Z — and drops the closing vertex when it
 * repeats the first, so edge walking never sees a zero-length segment.
 */
export function parsePolygon(d: string): Point[] {
  const tokens = d.match(/[MLHVZmlhvz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const ring: Point[] = [];
  let cmd = "";
  let x = 0;
  let y = 0;

  for (let i = 0; i < tokens.length; ) {
    const token = tokens[i];
    if (/[MLHVZmlhvz]/.test(token)) {
      cmd = token;
      i++;
      if (cmd === "Z" || cmd === "z") continue;
    }
    const upper = cmd.toUpperCase();
    const relative = cmd !== upper;

    if (upper === "H") {
      const v = Number(tokens[i++]);
      x = relative ? x + v : v;
    } else if (upper === "V") {
      const v = Number(tokens[i++]);
      y = relative ? y + v : v;
    } else {
      const vx = Number(tokens[i++]);
      const vy = Number(tokens[i++]);
      x = relative ? x + vx : vx;
      y = relative ? y + vy : vy;
    }
    ring.push({ x, y });
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (ring.length > 1 && Math.abs(first.x - last.x) < 1e-6 && Math.abs(first.y - last.y) < 1e-6) {
    ring.pop();
  }
  return ring;
}

/**
 * Crossing-number test, with an optional tolerance band so a point sampled onto
 * an edge is not rejected by floating-point drift.
 */
export function pointInPolygon(x: number, y: number, ring: Point[], tolerance = 0): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  if (inside || tolerance <= 0) return inside;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    if (distanceToSegment(x, y, ring[i], ring[j]) <= tolerance) return true;
  }
  return false;
}

function distanceToSegment(x: number, y: number, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / lengthSq));
  return Math.hypot(x - (a.x + t * dx), y - (a.y + t * dy));
}

/** Small deterministic generator, so a seed always yields the same cloud. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Shape {
  ring: Point[];
  role: number;
  perimeter: number;
  area: number;
  edges: { a: Point; b: Point; length: number }[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

function describe(d: string, role: number): Shape {
  const ring = parsePolygon(d);
  const edges = ring.map((a, i) => {
    const b = ring[(i + 1) % ring.length];
    return { a, b, length: Math.hypot(b.x - a.x, b.y - a.y) };
  });
  const perimeter = edges.reduce((sum, e) => sum + e.length, 0);

  let twiceArea = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    twiceArea += ring[j].x * ring[i].y - ring[i].x * ring[j].y;
    minX = Math.min(minX, ring[i].x);
    minY = Math.min(minY, ring[i].y);
    maxX = Math.max(maxX, ring[i].x);
    maxY = Math.max(maxY, ring[i].y);
  }

  return {
    ring,
    role,
    perimeter,
    area: Math.abs(twiceArea) / 2,
    edges,
    bounds: { minX, minY, maxX, maxY },
  };
}

export interface SampleOptions {
  /** Total points in the cloud. */
  count: number;
  /** Fraction laid along the edges rather than in the fill. */
  outlineShare: number;
  /** Half-thickness of the cloud on z, in normalised units. */
  depthJitter: number;
  seed: number;
}

export interface MarkCloud {
  /** xyz triples, centred on the origin and scaled to a unit square. */
  positions: Float32Array;
  /** BAR or BRIDGE_ROLE, one per point. */
  roles: Uint8Array;
  outlineCount: number;
}

/**
 * Lays `count` points over the mark: `outlineShare` of them spaced evenly along
 * the edges of all three shapes, the rest scattered through their interiors in
 * proportion to area, every one of them jittered on z.
 */
export function sampleMark({ count, outlineShare, depthJitter, seed }: SampleOptions): MarkCloud {
  const shapes = [
    describe(CHAIN_A, BAR),
    describe(CHAIN_B, BAR),
    describe(BRIDGE, BRIDGE_ROLE),
  ];
  const random = rng(seed);
  const positions = new Float32Array(count * 3);
  const roles = new Uint8Array(count);

  const outlineCount = Math.round(count * outlineShare);
  const fillCount = count - outlineCount;
  const totalPerimeter = shapes.reduce((sum, s) => sum + s.perimeter, 0);
  const totalArea = shapes.reduce((sum, s) => sum + s.area, 0);

  // Normalise from user space into a centred unit square, flipping y so the
  // mark stands the right way up once it reaches a GL coordinate system.
  let n = 0;
  const place = (x: number, y: number, role: number) => {
    positions[n * 3] = x / VIEWBOX - 0.5;
    positions[n * 3 + 1] = 0.5 - y / VIEWBOX;
    positions[n * 3 + 2] = (random() * 2 - 1) * depthJitter;
    roles[n] = role;
    n++;
  };

  // Edges, walked by arc length so the rim is evenly lit rather than bunching
  // at the corners of the longer shapes.
  let placedOutline = 0;
  shapes.forEach((shape, index) => {
    const share =
      index === shapes.length - 1
        ? outlineCount - placedOutline
        : Math.round((shape.perimeter / totalPerimeter) * outlineCount);
    placedOutline += share;

    for (let i = 0; i < share; i++) {
      let along = ((i + random() * 0.7) / share) * shape.perimeter;
      for (const edge of shape.edges) {
        if (along > edge.length) {
          along -= edge.length;
          continue;
        }
        const t = edge.length === 0 ? 0 : along / edge.length;
        place(edge.a.x + (edge.b.x - edge.a.x) * t, edge.a.y + (edge.b.y - edge.a.y) * t, shape.role);
        break;
      }
    }
  });

  // Interiors, by rejection against the ring, weighted by area so the bars do
  // not starve the smaller connector.
  let placedFill = 0;
  shapes.forEach((shape, index) => {
    const share =
      index === shapes.length - 1
        ? fillCount - placedFill
        : Math.round((shape.area / totalArea) * fillCount);
    placedFill += share;
    const { minX, minY, maxX, maxY } = shape.bounds;

    for (let i = 0; i < share; i++) {
      for (let attempt = 0; attempt < 64; attempt++) {
        const x = minX + random() * (maxX - minX);
        const y = minY + random() * (maxY - minY);
        if (pointInPolygon(x, y, shape.ring)) {
          place(x, y, shape.role);
          break;
        }
        if (attempt === 63) place(shape.ring[0].x, shape.ring[0].y, shape.role);
      }
    }
  });

  return { positions, roles, outlineCount };
}
