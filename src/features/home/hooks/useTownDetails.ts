"use client";

import {
  fetchChatbotTotals,
  type ChatbotTotalsResponse,
} from "@/lib/services/chatbot/totals";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { buildSeriesAndDonutFocused } from "@/lib/utils/data/seriesAndDonuts";
import { computeRangesByGranularityForSeries } from "@/lib/utils/time/granularityRanges";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/** Permite rango completo, objeto con endISO, o string endISO. */
export type TimeParams =
  | { startISO: string; endISO: string }
  | { endISO?: string }
  | undefined;

type State =
  | { status: "idle" | "loading" }
  | {
      status: "ready";
      series: { current: SeriesPoint[]; previous: SeriesPoint[] };
      donutData: DonutDatum[];
    }
  | { status: "error"; message: string };

function isFullRange(t: TimeParams): t is { startISO: string; endISO: string } {
  return (
    !!t &&
    typeof t === "object" &&
    "startISO" in t &&
    "endISO" in t &&
    typeof t.startISO === "string" &&
    typeof t.endISO === "string"
  );
}

function normalizeTime(time?: TimeParams | string): {
  startISO?: string;
  endISO?: string;
} {
  if (typeof time === "string") return { endISO: time };
  if (!time) return {};
  if (isFullRange(time))
    return { startISO: time.startISO, endISO: time.endISO };
  return { endISO: time.endISO };
}

/* ========================= API pública ========================= */
// Overloads
export function useTownDetails(
  id: TownId | null,
  granularity: Granularity,
  time?: { endISO?: string } | string,
  categoryId?: CategoryId
): ReturnType<typeof useTownDetailsImpl>;
export function useTownDetails(
  id: TownId | null,
  granularity: Granularity,
  time: { startISO: string; endISO: string },
  categoryId?: CategoryId
): ReturnType<typeof useTownDetailsImpl>;
export function useTownDetails(
  id: TownId | null,
  granularity: Granularity,
  time?: TimeParams | string,
  categoryId?: CategoryId
): ReturnType<typeof useTownDetailsImpl> {
  return useTownDetailsImpl(id, granularity, time, categoryId);
}

/* ========================= implementación ========================= */
function useTownDetailsImpl(
  id: TownId | null,
  granularity: Granularity,
  time?: TimeParams | string,
  categoryId?: CategoryId
) {
  const { startISO, endISO } = normalizeTime(time);

  // Calcular rangos usando computeRangesForKPI para respetar la granularidad seleccionada
  // IMPORTANTE: Para Home, usar computeRangesForKPI que respeta la granularidad exacta:
  // - Granularidad "d": 1 día (ayer vs anteayer)
  // - Granularidad "w": 7 días
  // - Granularidad "m": 30 días
  // - Granularidad "y": 365 días
  const ranges = useMemo(() => {
    if (startISO && endISO) {
      return computeRangesForKPI(granularity, startISO, endISO);
    } else {
      return computeRangesForKPI(granularity, null, endISO);
    }
  }, [granularity, startISO, endISO]);

  // Query para GA4 data
  const ga4Query = useQuery({
    queryKey: [
      "townDetails",
      "ga4",
      id,
      granularity,
      ranges.current.start,
      ranges.current.end,
      categoryId,
    ],
    queryFn: async () => {
      if (!id) throw new Error("Town ID is required");

      // Construir URL con parámetros apropiados usando los rangos calculados
      const params = new URLSearchParams();
      params.set("granularity", granularity);
      params.set("startDate", ranges.current.start);
      params.set("endDate", ranges.current.end);

      if (categoryId) {
        params.set("categoryId", categoryId);
      }

      const url = `/api/analytics/v1/dimensions/pueblos/details/${id}?${params}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch GA4 town details: ${response.statusText}`
        );
      }

      const data = await response.json();

      return {
        series: data.series || { current: [], previous: [] },
        donutData: data.donutData || [],
      };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Query para Chatbot data (una sola llamada para todos los datos)
  const chatbotQuery = useQuery<ChatbotTotalsResponse>({
    queryKey: ["chatbot", "totals", granularity, startISO, endISO],
    queryFn: () => {
      // Para que el chatbot tenga los mismos rangos que GA4, necesitamos calcular
      // los rangos aquí usando la misma lógica que la API route de GA4
      if (startISO && endISO) {
        // Rango personalizado: pasar tal como está
        return fetchChatbotTotals({
          granularity,
          startDate: startISO,
          endDate: endISO,
        });
      } else {
        // Usar la fecha final y dejar que fetchChatbotTotals calcule los rangos correctos
        // con computeRangesByGranularityForSeries para series (igual que GA4)
        const endDate =
          endISO ||
          new Date(Date.now() - 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

        // Calcular rangos para series usando la misma función que GA4
        const ranges = computeRangesByGranularityForSeries(
          granularity,
          endDate
        );

        // Pasar el rango completo que incluye current + previous periods
        return fetchChatbotTotals({
          granularity,
          startDate: ranges.previous.start, // Desde el inicio del período anterior
          endDate: ranges.current.end, // Hasta el final del período actual
        });
      }
    },
    enabled: true, // Siempre habilitado porque no depende del townId específico
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Procesar datos del chatbot usando buildSeriesAndDonutFocused
  const chatbotTownSeries = useMemo(() => {
    if (!chatbotQuery.data || !id)
      return { current: [], previous: [], donutData: [] };

    try {
      // Calcular rangos usando la misma lógica que GA4
      const endDate =
        endISO ||
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const ranges = computeRangesByGranularityForSeries(granularity, endDate);

      // Usar buildSeriesAndDonutFocused para procesar los datos del chatbot
      const result = buildSeriesAndDonutFocused(
        {
          granularity,
          currentRange: ranges.current,
          prevRange: ranges.previous,
          focus: { type: "town", id },
        },
        chatbotQuery.data
      );

      return {
        current: result.series.current,
        previous: result.series.previous,
        donutData: result.donutData,
      };
    } catch (error) {
      console.warn("Error procesando series de chatbot para town:", error);
      return { current: [], previous: [], donutData: [] };
    }
  }, [chatbotQuery.data, id, granularity, endISO]);

  // Función helper para combinar series GA4 + Chatbot
  const combinedSeries = useMemo(() => {
    if (!ga4Query.data?.series || !chatbotTownSeries.current.length) {
      // Si no hay datos del chatbot, usar solo GA4
      return ga4Query.data?.series || { current: [], previous: [] };
    }

    // Combinar series: sumar valores por fecha
    const combineCurrent = ga4Query.data.series.current.map(
      (ga4Point: SeriesPoint) => {
        const chatbotPoint = chatbotTownSeries.current.find(
          (cbPoint) => cbPoint.label === ga4Point.label
        );
        return {
          label: ga4Point.label,
          value: ga4Point.value + (chatbotPoint?.value || 0),
        };
      }
    );

    const combinePrevious = ga4Query.data.series.previous.map(
      (ga4Point: SeriesPoint) => {
        const chatbotPoint = chatbotTownSeries.previous.find(
          (cbPoint) => cbPoint.label === ga4Point.label
        );
        return {
          label: ga4Point.label,
          value: ga4Point.value + (chatbotPoint?.value || 0),
        };
      }
    );

    return {
      current: combineCurrent,
      previous: combinePrevious,
    };
  }, [ga4Query.data?.series, chatbotTownSeries]);

  // Función helper para combinar donut GA4 + Chatbot
  const combinedDonutData = useMemo(() => {
    if (!ga4Query.data?.donutData || !chatbotTownSeries.donutData.length) {
      // Si no hay datos del chatbot, usar solo GA4
      return ga4Query.data?.donutData || [];
    }

    // Combinar donuts: crear mapa de valores combinados
    const combinedMap: Record<string, number> = {};

    // Agregar datos de GA4
    ga4Query.data.donutData.forEach((item: DonutDatum) => {
      combinedMap[item.label] = (combinedMap[item.label] || 0) + item.value;
    });

    // Agregar datos de Chatbot
    chatbotTownSeries.donutData.forEach((item) => {
      combinedMap[item.label] = (combinedMap[item.label] || 0) + item.value;
    });

    // Convertir a array y ordenar por valor descendente
    const result = Object.entries(combinedMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => {
        if (b.value !== a.value) return b.value - a.value;
        return a.label.localeCompare(b.label);
      });

    return result;
  }, [ga4Query.data?.donutData, chatbotTownSeries.donutData]);

  // Estado combinado (GA4 + Chatbot)
  const state: State = useMemo(() => {
    if (ga4Query.isLoading || chatbotQuery.isLoading) {
      return { status: "loading" };
    }

    if (ga4Query.error) {
      const message = ga4Query.error?.message || "Unknown error";
      return { status: "error", message };
    }

    if (ga4Query.data) {
      return {
        status: "ready",
        series: combinedSeries,
        donutData: combinedDonutData,
      };
    }

    return { status: "idle" };
  }, [ga4Query, chatbotQuery, combinedSeries, combinedDonutData]);

  const series = useMemo(
    () =>
      state.status === "ready" ? state.series : { current: [], previous: [] },
    [state]
  );

  const donutData = useMemo(
    () => (state.status === "ready" ? state.donutData : []),
    [state]
  );

  return {
    state,
    series,
    donutData,
    // Para debug: datos separados de GA4, Chatbot y Combinados
    debug: {
      ga4: {
        series: ga4Query.data?.series || { current: [], previous: [] },
        donutData: ga4Query.data?.donutData || [],
        isLoading: ga4Query.isLoading,
        error: ga4Query.error,
      },
      chatbot: {
        series: {
          current: chatbotTownSeries.current,
          previous: chatbotTownSeries.previous,
        },
        donutData: chatbotTownSeries.donutData,
        isLoading: chatbotQuery.isLoading,
        error: chatbotQuery.error,
        rawData: chatbotQuery.data,
      },
      combined: {
        series: combinedSeries,
        donutData: combinedDonutData,
        note: "Production data: GA4 + Chatbot combined",
      },
    },
  };
}
