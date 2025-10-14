"use client";

import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import {
  getUrlDrilldown,
  UrlDrilldownResponse,
} from "../services/urlDrilldown";

type Args = {
  path: string | null; // puede ser null mientras no haya selección
  granularity: Granularity;
  endISO?: string;
};

type State =
  | { loading: true; selectedPath: string | null }
  | {
      loading: false;
      selectedPath: string;
      seriesAvgEngagement: { current: SeriesPoint[]; previous: SeriesPoint[] };
      kpis: {
        current: {
          activeUsers: number;
          userEngagementDuration: number;
          newUsers: number;
          eventCount: number;
          sessions: number;
          averageSessionDuration: number;
          avgEngagementPerUser: number;
          eventsPerSession: number;
        };
        previous: {
          activeUsers: number;
          userEngagementDuration: number;
          newUsers: number;
          eventCount: number;
          sessions: number;
          averageSessionDuration: number;
          avgEngagementPerUser: number;
          eventsPerSession: number;
        };
        deltaPct: {
          activeUsers: number;
          newUsers: number;
          eventCount: number;
          sessions: number;
          averageSessionDuration: number;
          avgEngagementPerUser: number;
          eventsPerSession: number;
        };
      } | null;
      operatingSystems: DonutDatum[];
      devices: DonutDatum[];
      countries: DonutDatum[];
      deltaPct: number;
    };

export function useUrlDrilldown({ path, granularity, endISO }: Args) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["url-drilldown", path, granularity, endISO],
    queryFn: async (): Promise<UrlDrilldownResponse> => {
      if (!path) throw new Error("Path is required");
      return getUrlDrilldown({ path, granularity, endISO });
    },
    enabled: Boolean(path),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error) => {
      if (error instanceof DOMException && error.name === "AbortError")
        return false;
      return failureCount < 2;
    },
  });

  // DEBUG TRACE
  console.debug("[useUrlDrilldown] queryKey:", [
    "url-drilldown",
    path,
    granularity,
    endISO,
  ]);
  console.debug("[useUrlDrilldown] enabled:", Boolean(path), "path:", path);
  if (isLoading) console.debug("[useUrlDrilldown] loading...");
  if (error) console.debug("[useUrlDrilldown] error:", error);
  if (data)
    console.debug(
      "[useUrlDrilldown] kpis:",
      data.kpis ? Object.keys(data.kpis.current || {}).length : 0,
      "seriesAvgEngagement curr len:",
      data.seriesAvgEngagement?.current?.length,
      "devices:",
      data.devices?.length,
      "countries:",
      data.countries?.length
    );

  if (!path) {
    return {
      loading: true,
      selectedPath: null,
    } as State;
  }

  if (isLoading) {
    return {
      loading: true,
      selectedPath: path,
    } as State;
  }

  if (error || !data) {
    // En error devolvemos estructura vacía pero válida
    return {
      loading: false,
      selectedPath: path,
      seriesAvgEngagement: { current: [], previous: [] },
      kpis: null,
      operatingSystems: [],
      devices: [],
      countries: [],
      deltaPct: 0,
    } as State;
  }

  return {
    loading: false,
    selectedPath: data.context?.path ?? path,
    seriesAvgEngagement: data.seriesAvgEngagement,
    kpis: data.kpis ?? null,
    operatingSystems: data.operatingSystems ?? [],
    devices: data.devices ?? [],
    countries: data.countries ?? [],
    deltaPct: Number.isFinite(data.deltaPct) ? data.deltaPct : 0,
  } as State;
}
