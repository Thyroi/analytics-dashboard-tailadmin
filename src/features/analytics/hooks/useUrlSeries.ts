"use client";

import { fetchJSON } from "@/lib/api/analytics";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

type UrlDrilldownResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  context: { path: string };
  xLabels: string[];
  seriesAvgEngagement: {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  kpis: {
    current: Record<string, number>;
    previous: Record<string, number>;
    deltaPct: Record<string, number>;
  };
  operatingSystems: DonutDatum[];
  genders: DonutDatum[];
  countries: DonutDatum[];
  deltaPct: number;
};

type UseUrlSeriesReturn =
  | { loading: true }
  | {
      loading: false;
      data: UrlDrilldownResponse;
      seriesByUrl: {
        name: string;
        data: number[];
        path: string;
      }[];
      xLabels: string[];
    };

export function useUrlSeries({
  urls,
  granularity,
  endISO,
}: {
  urls: string[];
  granularity: Granularity;
  endISO?: string;
}): UseUrlSeriesReturn {
  // Solo ejecutar query si tenemos URLs
  const url = urls[0]; // Por ahora solo manejamos una URL

  const { data, isLoading, error } = useQuery({
    queryKey: ["url-series", url, granularity, endISO],
    queryFn: async (): Promise<UrlDrilldownResponse> => {
      if (!url) throw new Error("No URL provided");

      const params = new URLSearchParams();
      params.set("path", url);
      params.set("g", granularity);
      if (endISO) params.set("end", endISO);

      return fetchJSON<UrlDrilldownResponse>(
        `/api/analytics/v1/drilldown/url?${params.toString()}`
      );
    },
    enabled: Boolean(url), // Solo ejecutar si tenemos URL
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error) => {
      // No reintentar en caso de errores de abort
      if (error instanceof Error && error.name === "AbortError") return false;
      return failureCount < 2;
    },
  });

  // DEBUG TRACE
  console.debug("[useUrlSeries] queryKey:", [
    "url-series",
    url,
    granularity,
    endISO,
  ]);
  console.debug("[useUrlSeries] enabled:", Boolean(url), "url:", url);
  if (isLoading) console.debug("[useUrlSeries] loading...");
  if (error) console.debug("[useUrlSeries] error:", error);
  if (data)
    console.debug(
      "[useUrlSeries] xLabels:",
      data.xLabels?.length,
      "avgEngagement curr len:",
      data.seriesAvgEngagement?.current?.length
    );

  // Si no hay URLs o está cargando
  if (!url || isLoading) {
    return { loading: true };
  }

  // Si hay error, mostrar estado de loading (sin datos)
  if (error) {
    console.error("Failed to fetch URL series:", error);
    return { loading: true };
  }

  // Si no hay datos (no debería pasar pero por seguridad)
  if (!data) {
    return { loading: true };
  }

  // Estado exitoso con datos
  const seriesByUrl = [
    {
      name: url.split("/").filter(Boolean).pop() || url,
      data: data.seriesAvgEngagement.current.map((point) => point.value),
      path: url,
    },
  ];

  return {
    loading: false,
    data,
    seriesByUrl,
    xLabels: data.xLabels,
  };
}
