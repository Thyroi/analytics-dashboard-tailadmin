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

/**
 * Determine if multi mode should use grouped bar chart
 */
export function shouldUseGroupedBar(
  mode: string,
  granularity?: string
): boolean {
  return mode === "multi" && granularity === "d";
}
