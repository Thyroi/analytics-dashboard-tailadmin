/**
 * Helpers para cálculos de drilldown de URLs
 */

import type { SeriesPoint } from "@/lib/types";

/**
 * Calcula el porcentaje de delta entre dos valores
 * @returns 0 si prev <= 0 y curr = 0, 100 si prev <= 0 y curr > 0, delta% en otro caso
 */
export function pctDelta(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

/**
 * Calcula series de ratio (promedio bucket a bucket): num/den
 */
export function ratioSeries(
  num: { current: SeriesPoint[]; previous: SeriesPoint[] },
  den: { current: SeriesPoint[]; previous: SeriesPoint[] }
): { current: SeriesPoint[]; previous: SeriesPoint[] } {
  const div = (A: SeriesPoint[], B: SeriesPoint[]) =>
    A.map((p, i) => {
      const d = B[i]?.value ?? 0;
      return { label: p.label, value: d > 0 ? p.value / d : 0 };
    });
  return {
    current: div(num.current, den.current),
    previous: div(num.previous, den.previous),
  };
}

/**
 * Convierte un valor string/null a número
 */
export function num(v?: string | null): number {
  return Number(v ?? 0);
}

/**
 * División segura (evita división por cero)
 */
export function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}
