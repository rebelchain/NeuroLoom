export function cursorInMarkSpace(
  pointerWorldX: number,
  pointerWorldY: number,
  depthRatio: number,
  groupX: number,
  groupY: number,
  scale: number,
): { x: number; y: number } {
  const divisor = Math.max(scale, 1e-4);
  return {
    x: (pointerWorldX * depthRatio - groupX) / divisor,
    y: (pointerWorldY * depthRatio - groupY) / divisor,
  };
}
