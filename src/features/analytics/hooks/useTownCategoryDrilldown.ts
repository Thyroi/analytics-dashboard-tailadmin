"use client";

import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { useDrilldownDetails } from "./useDrilldownDetails";

// Keep the original interface for backward compatibility
export type SubSeries = { name: string; data: number[]; path: string };

/**
 * Backward-compatible wrapper around the new generic drilldown hook.
 * Maintains the original interface while using the new endpoint architecture.
 */
export function useTownCategoryDrilldown(args: {
  townId: TownId;
  categoryId: CategoryId;
  granularity: Granularity;
  endISO?: string;
}) {
  const { townId, categoryId, granularity, endISO } = args;

  // Use the new generic hook with pueblo-category configuration
  const drilldown = useDrilldownDetails({
    type: "pueblo-category",
    townId,
    categoryId,
    granularity,
    endISO,
  });

  // Transform the new response format back to the expected legacy format
  if (drilldown.loading) {
    return {
      loading: true,
      xLabels: [],
      seriesByUrl: [],
      donut: [],
      deltaPct: 0,
    };
  }

  // For drilldown scenarios, URLs in donut should be converted to seriesByUrl format
  // Since the new endpoint returns URLs in the donut when drilling down,
  // we need to convert them to the expected seriesByUrl format
  const seriesByUrl: SubSeries[] = drilldown.donut.map((item) => ({
    name: item.label,
    data: [], // The new endpoint doesn't provide series data in donut format
    path: item.label, // Assume the label is the URL/path
  }));

  // For backward compatibility, create empty xLabels since the new endpoint
  // doesn't provide this in the response (it's moved to series)
  const xLabels: string[] = drilldown.response.series.current.map(
    (item) => item.label
  );

  return {
    loading: false,
    xLabels,
    seriesByUrl,
    donut: drilldown.donut,
    deltaPct: drilldown.deltaPct,
  };
}
