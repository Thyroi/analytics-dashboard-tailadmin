// Hook for the working fixed API
import { fetchJSON } from "@/lib/api/analytics";
import type { SeriesPoint } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export type SeriesData = {
  path: string;
  data: SeriesPoint[];
};

export type FixedApiResponse = {
  series: SeriesData[];
  granularity: string;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  xLabels: string[];
};

export function useTopComparativePagesSeries(
  selectedPaths: string[],
  granularity: "d" | "w" | "m" | "y" = "d",
  dateRange?: { start: string; end: string },
) {
  return useQuery({
    queryKey: [
      "analytics",
      "top-comparative-pages-series",
      selectedPaths,
      granularity,
      dateRange,
    ],
    queryFn: async (): Promise<FixedApiResponse> => {
      if (selectedPaths.length === 0) {
        return {
          series: [],
          granularity,
          range: {
            current: { start: "", end: "" },
            previous: { start: "", end: "" },
          },
          xLabels: [],
        };
      }

      const url = new URLSearchParams();
      // Use provided date range or fallback to default
      url.set("start", dateRange?.start || "2025-09-01");
      url.set("end", dateRange?.end || "2025-10-21");
      url.set("granularity", granularity);

      selectedPaths.forEach((path) => {
        url.append("includeSeriesFor", path);
      });

      const fullUrl = `/api/analytics/v1/top-comparative-pages-fixed?${url.toString()}`;

      return fetchJSON<FixedApiResponse>(fullUrl);
    },
    enabled: selectedPaths.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
