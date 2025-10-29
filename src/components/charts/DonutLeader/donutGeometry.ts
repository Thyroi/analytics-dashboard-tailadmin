export const TAU = Math.PI * 2;

/**
 * Convierte coordenadas polares a cartesianas
 */
export function polarToXY(
  cx: number,
  cy: number,
  r: number,
  angle: number
): { x: number; y: number } {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

/**
 * Genera el path SVG para un arco donut
 */
export function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number
): string {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const p0 = polarToXY(cx, cy, rOuter, start);
  const p1 = polarToXY(cx, cy, rOuter, end);
  const q1 = polarToXY(cx, cy, rInner, end);
  const q0 = polarToXY(cx, cy, rInner, start);
  return [
    `M ${p0.x} ${p0.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
    `L ${q1.x} ${q1.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${q0.x} ${q0.y}`,
    "Z",
  ].join(" ");
}
