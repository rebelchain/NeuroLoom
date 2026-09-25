export interface ScreenBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface NdcRect {
  x: number;
  y: number;
  halfWidth: number;
  halfHeight: number;
}

export function toNdcRect(box: ScreenBox, viewportWidth: number, viewportHeight: number): NdcRect {
  const perUnit = viewportHeight > 0 ? 2 / viewportHeight : 0;
  return {
    x: (box.left + box.width / 2 - viewportWidth / 2) * perUnit,
    y: (viewportHeight / 2 - (box.top + box.height / 2)) * perUnit,
    halfWidth: (box.width / 2) * perUnit,
    halfHeight: (box.height / 2) * perUnit,
  };
}

export const calmRect: NdcRect & { on: boolean } = {
  x: 0,
  y: 0,
  halfWidth: 0,
  halfHeight: 0,
  on: false,
};
