"use client";

import { fetchJSON } from "@/lib/api/analytics";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useQueries, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  // Optimización: Verificar qué URLs ya están en caché para evitar queries duplicadas
  const cachedUrls = new Set<string>();
  const uncachedUrls = urls.filter((url) => {
    const queryKey = ["url-series", url, granularity, endISO];
    const cachedData = queryClient.getQueryData(queryKey);
    if (cachedData) {
      cachedUrls.add(url);
      return false; // No necesita query
    }
    return true; // Necesita query
  });

  // Solo ejecutar queries para URLs que no están en caché
  const queries = useQueries({
    queries: uncachedUrls.map((url) => ({
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
      enabled: Boolean(url),
      staleTime: 5 * 60 * 1000,
      retry: (failureCount: number, error: Error) => {
        if (error instanceof Error && error.name === "AbortError") return false;
        return failureCount < 2;
      },
    })),
  });

  // Combinar datos cacheados con queries en progreso
  const allQueries = urls.map((url) => {
    if (cachedUrls.has(url)) {
      const queryKey = ["url-series", url, granularity, endISO];
      const cachedData =
        queryClient.getQueryData<UrlDrilldownResponse>(queryKey);
      return {
        data: cachedData,
        isLoading: false,
        error: null,
      };
    } else {
      const queryIndex = uncachedUrls.indexOf(url);
      return queries[queryIndex];
    }
  });

  const isLoading = allQueries.some((query) => query.isLoading);
  const hasError = allQueries.some((query) => query.error);

  // Si no hay URLs o está cargando
  if (urls.length === 0 || isLoading) {
    return { loading: true };
  }

  // Si hay errores, mostrar estado de loading (sin datos)
  if (hasError) {
    return { loading: true };
  }

  // Obtener el primer resultado exitoso para los xLabels (todos deberían tener los mismos)
  const firstSuccessfulData = allQueries.find((query) => query.data)?.data;
  if (!firstSuccessfulData) {
    return { loading: true };
  }

  // Estado exitoso con datos de múltiples URLs
  const seriesByUrl = allQueries
    .map((query, index) => {
      const url = urls[index];
      const data = query.data;

      if (!data || query.error) {
        return null;
      }

      return {
        name: url.split("/").filter(Boolean).pop() || url,
        data: data.seriesAvgEngagement.current.map((point) => point.value),
        path: url,
      };
    })
    .filter(
      (item): item is { name: string; data: number[]; path: string } =>
        item !== null
    );

  return {
    loading: false,
    data: firstSuccessfulData,
    seriesByUrl,
    xLabels: firstSuccessfulData.xLabels,
  };
}
