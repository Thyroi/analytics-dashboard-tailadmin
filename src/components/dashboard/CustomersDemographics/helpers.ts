/** Trunca a 1 decimal sin redondear (4.19 -> 4.1) */
export function trunc1(value: number): number {
  return Math.floor((value + 1e-8) * 10) / 10;
}

/** % truncado a 1 decimal y etiqueta fija "x.x" */
export function pct1(
  numerator: number,
  denominator: number
): { n: number; s: string } {
  if (!denominator || denominator <= 0) return { n: 0, s: "0.0" };
  const p = trunc1((numerator / denominator) * 100);
  return { n: p, s: p.toFixed(1) };
}
