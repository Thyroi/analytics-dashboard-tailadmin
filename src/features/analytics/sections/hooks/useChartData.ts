/**
 * Hook for processing chart data with comprehensive error barriers
 */

import { colorForPath, getContrastingColors } from "@/lib/analytics/colors";
import { useMemo } from "react";

interface SeriesData {
  series: Array<{
    path: string;
    data: Array<{
      label: string;
      value: number;
    }>;
  }>;
  xLabels: string[];
  granularity: string;
}

interface ChartData {
  series: Array<{
    name: string;
    data: Array<{ x: string; y: number }>;
    color: string;
  }>;
  categories: string[];
}

export function useChartData(
  seriesData: SeriesData | null | undefined,
  selectedPaths: string[],
): ChartData | null {
  return useMemo(() => {
    try {
      if (
        !seriesData?.series ||
        !Array.isArray(seriesData.series) ||
        selectedPaths.length === 0
      ) {
        return null;
      }

      // Keep raw xLabels to preserve unique keys across granularities
      let categories: string[] = [];

      if (seriesData.xLabels && Array.isArray(seriesData.xLabels)) {
        categories = seriesData.xLabels
          .map((label) => String(label ?? "").trim())
          .filter((label) => label !== "");
      }

      // Get contrasting colors for maximum differentiation
      const pathColorMap = getContrastingColors(selectedPaths);

      // Process series using the formatted categories
      const series = seriesData.series
        .filter((s) => {
          return s && typeof s === "object" && s.path && Array.isArray(s.data);
        })
        .map((s) => {
          try {
            const displayName =
              s.path === "/"
                ? "Inicio"
                : s.path.split("/").filter(Boolean).pop() || s.path;

            return {
              name: displayName,
              data: s.data
                .filter((p) => {
                  return (
                    p && typeof p === "object" && typeof p.value === "number"
                  );
                })
                .map((p, index) => {
                  const formattedLabel =
                    categories[index] || String(p.label || "");
                  return {
                    x: formattedLabel,
                    y: Number(p.value) || 0,
                  };
                }),
              color: pathColorMap[s.path] || colorForPath(s.path),
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean) as ChartData["series"];

      if (series.length === 0) {
        return null;
      }

      return { series, categories };
    } catch {
      return null;
    }
  }, [seriesData, selectedPaths]);
}
