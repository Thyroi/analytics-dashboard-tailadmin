"use client";

import {
  fetchChatbotTotals,
  type ChatbotTotalsResponse,
} from "@/lib/services/chatbot/totals";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { buildSeriesAndDonutFocused } from "@/lib/utils/data/seriesAndDonuts";
import { computeRangesByGranularityForSeries } from "@/lib/utils/time/granularityRanges";
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

// Overloads para mantener compatibilidad
export function useCategoryDetails(
  id: CategoryId | null,
  granularity: Granularity,
  time?: { endISO?: string } | string
): ReturnType<typeof useCategoryDetailsImpl>;
export function useCategoryDetails(
  id: CategoryId | null,
  granularity: Granularity,
  time: { startISO: string; endISO: string }
): ReturnType<typeof useCategoryDetailsImpl>;
export function useCategoryDetails(
  id: CategoryId | null,
  granularity: Granularity,
  time?: TimeParams | string
): ReturnType<typeof useCategoryDetailsImpl> {
  return useCategoryDetailsImpl(id, granularity, time);
}

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

function useCategoryDetailsImpl(
  id: CategoryId | null,
  granularity: Granularity,
  time?: TimeParams | string
) {
  const { startISO, endISO } = normalizeTime(time);

  // Nota: Los rangos se calculan automáticamente en la API route usando las reglas:
  // - Series: computeRangesForSeries (g==="d" usa 7 días, otros usan duración estándar)
  // - Donut: computeRangesForKPI (g==="d" usa último día, otros usan rango completo)

  // Query para GA4 data
  const ga4Query = useQuery({
    queryKey: ["categoryDetails", "ga4", id, granularity, startISO, endISO],
    queryFn: async () => {
      if (!id) throw new Error("Category ID is required");

      // Construir URL con parámetros apropiados
      const params = new URLSearchParams();
      params.set("g", granularity);

      if (startISO && endISO) {
        // Rango personalizado
        params.set("start", startISO);
        params.set("end", endISO);
      } else if (endISO) {
        // Solo fecha final
        params.set("end", endISO);
      }

      // Nota: La API route maneja automáticamente las reglas de granularidad:
      // - Series: computeRangesByGranularityForSeries (7 días para g='d')
      // - Donut: computeRangesByGranularity (1 día para g='d')
      const url = `/api/analytics/v1/dimensions/categorias/details/${id}?${params}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch GA4 category details: ${response.statusText}`
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
    enabled: true, // Siempre habilitado porque no depende del categoryId específico
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Procesar datos del chatbot usando buildSeriesAndDonutFocused
  const chatbotCategorySeries = useMemo(() => {
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
          focus: { type: "category", id },
        },
        chatbotQuery.data
      );

      return {
        current: result.series.current,
        previous: result.series.previous,
        donutData: result.donutData,
      };
    } catch (error) {
      console.warn("Error procesando series de chatbot:", error);
      return { current: [], previous: [], donutData: [] };
    }
  }, [chatbotQuery.data, id, granularity, endISO]);

  // Función helper para combinar series GA4 + Chatbot
  const combinedSeries = useMemo(() => {
    if (!ga4Query.data?.series || !chatbotCategorySeries.current.length) {
      // Si no hay datos del chatbot, usar solo GA4
      return ga4Query.data?.series || { current: [], previous: [] };
    }

    // Combinar series: sumar valores por fecha
    const combineCurrent = ga4Query.data.series.current.map(
      (ga4Point: SeriesPoint) => {
        const chatbotPoint = chatbotCategorySeries.current.find(
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
        const chatbotPoint = chatbotCategorySeries.previous.find(
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
  }, [ga4Query.data?.series, chatbotCategorySeries]);

  // Función helper para combinar donut GA4 + Chatbot
  const combinedDonutData = useMemo(() => {
    if (!ga4Query.data?.donutData || !chatbotCategorySeries.donutData.length) {
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
    chatbotCategorySeries.donutData.forEach((item) => {
      combinedMap[item.label] = (combinedMap[item.label] || 0) + item.value;
    });

    // Convertir a array y ordenar por valor descendente
    return Object.entries(combinedMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => {
        if (b.value !== a.value) return b.value - a.value;
        return a.label.localeCompare(b.label);
      });
  }, [ga4Query.data?.donutData, chatbotCategorySeries.donutData]);

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
  };
}
