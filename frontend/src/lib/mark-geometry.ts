export const BAR = 0;
export const BRIDGE_ROLE = 1;

export interface SampleOptions {
  count: number;
  outlineShare: number;
  depthJitter: number;
  seed: number;
}

export interface MarkCloud {
  positions: Float32Array;
  roles: Uint8Array;
  outlineCount: number;
}

function rng(seed: number) {
  return function () {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function sampleMark({
  count,
  outlineShare,
  depthJitter,
  seed,
}: SampleOptions): MarkCloud {
  const random = rng(seed);
  const positions = new Float32Array(count * 3);
  const roles = new Uint8Array(count);
  const height = 0.75;
  const width = 0.6;
  const thickness = 0.12;

  const limitLeft = Math.floor(count * 0.35);
  const limitRight = limitLeft + Math.floor(count * 0.35);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let x = 0;
    let y = 0;

    if (i < limitLeft) {
      x = -width / 2 + (random() - 0.5) * thickness;
      y = (random() - 0.5) * height;
      roles[i] = BAR;
    } else if (i < limitRight) {
      x = width / 2 + (random() - 0.5) * thickness;
      y = (random() - 0.5) * height;
      roles[i] = BAR;
    } else {
      const t = random();
      const diagX = -width / 2 + t * width;
      const diagY = height / 2 - t * height;
      x = diagX + (random() - 0.5) * thickness;
      y = diagY + (random() - 0.5) * thickness;
      roles[i] = BRIDGE_ROLE;
    }

    const z = (random() * 2 - 1) * depthJitter;

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
  }

  return { positions, roles, outlineCount: Math.round(count * outlineShare) };
}
