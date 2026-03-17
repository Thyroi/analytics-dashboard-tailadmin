import type { SeriesPoint } from "@/lib/types";

/**
 * Get minimum length between current and previous series
 */
export function minLen(series: {
  current: SeriesPoint[];
  previous: SeriesPoint[];
}): number {
  return Math.min(series.current.length, series.previous.length);
}

export function shouldUseSingleDayComparison(series: {
  current: SeriesPoint[];
  previous: SeriesPoint[];
}): boolean {
  return Math.max(series.current.length, series.previous.length) <= 1;
}

/**
 * Determine if multi mode should use grouped bar chart
 */
export function shouldUseGroupedBar(
  mode: string,
  granularity?: string,
): boolean {
  return mode === "multi" && granularity === "d";
}
