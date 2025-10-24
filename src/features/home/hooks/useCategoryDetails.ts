"use client";

import { fetchCategoriaDetails } from "@/lib/services/categorias/details";
import {
  fetchChatbotTotals,
  type ChatbotTotalsResponse,
} from "@/lib/services/chatbot/totals";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { buildSeriesAndDonutFocused } from "@/lib/utils/data/seriesAndDonuts";
import { calculatePreviousPeriodWithGranularity } from "@/lib/utils/time/rangeCalculations";
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

  // Calcular rangos usando la función correcta de rangeCalculations.ts
  const ranges = useMemo(() => {
    if (startISO && endISO) {
      // Usar la función correcta para calcular rangos
      const calculation = calculatePreviousPeriodWithGranularity(
        startISO,
        endISO,
        granularity
      );

      const calculatedRanges = {
        current: calculation.currentRange,
        previous: calculation.prevRange,
      };

      return calculatedRanges;
    } else {
      // Para casos sin rango completo, usar fecha por defecto
      const endDate =
        endISO ||
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Para casos automáticos, necesitamos generar un rango basado en granularidad
      let currentStart: string;
      const currentEnd = endDate;

      switch (granularity) {
        case "d":
          // 7 días para series diarias
          currentStart = new Date(
            new Date(endDate).getTime() - 6 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0];
          break;
        case "w":
          // 4 semanas
          currentStart = new Date(
            new Date(endDate).getTime() - 27 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0];
          break;
        case "m":
          // 12 meses
          currentStart = new Date(
            new Date(endDate).getTime() - 364 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0];
          break;
        case "y":
          // 3 años
          currentStart = new Date(
            new Date(endDate).getTime() - 1094 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0];
          break;
        default:
          currentStart = new Date(
            new Date(endDate).getTime() - 6 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0];
      }

      const calculation = calculatePreviousPeriodWithGranularity(
        currentStart,
        currentEnd,
        granularity
      );

      const autoRanges = {
        current: calculation.currentRange,
        previous: calculation.prevRange,
      };

      return autoRanges;
    }
  }, [granularity, startISO, endISO]);

  // Query para GA4 data usando el nuevo servicio
  const ga4Query = useQuery({
    queryKey: [
      "categoryDetails",
      "ga4",
      id,
      granularity,
      ranges.current.start,
      ranges.current.end,
    ],
    queryFn: async () => {
      if (!id) throw new Error("Category ID is required");

      const response = await fetchCategoriaDetails({
        categoryId: id,
        granularity,
        startDate: ranges.current.start,
        endDate: ranges.current.end,
      });

      console.log("[useCategoryDetails] Service response:", response);

      return {
        series: response.data.series || { current: [], previous: [] },
        donutData: response.data.donutData || [],
      };
    },
    enabled: !!id && !!ranges.current.start && !!ranges.current.end,
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
        // Calcular rangos usando la misma lógica que GA4
        const endDate =
          endISO ||
          new Date(Date.now() - 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

        // Generar rango basado en granularidad para chatbot
        let currentStart: string;
        switch (granularity) {
          case "d":
            currentStart = new Date(
              new Date(endDate).getTime() - 6 * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0];
            break;
          case "w":
            currentStart = new Date(
              new Date(endDate).getTime() - 27 * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0];
            break;
          case "m":
            currentStart = new Date(
              new Date(endDate).getTime() - 364 * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0];
            break;
          case "y":
            currentStart = new Date(
              new Date(endDate).getTime() - 1094 * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0];
            break;
          default:
            currentStart = new Date(
              new Date(endDate).getTime() - 6 * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0];
        }

        const calculation = calculatePreviousPeriodWithGranularity(
          currentStart,
          endDate,
          granularity
        );
        const ranges = {
          current: calculation.currentRange,
          previous: calculation.prevRange,
        };

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

      // Generar rango basado en granularidad
      let currentStart: string;
      switch (granularity) {
        case "d":
          currentStart = new Date(
            new Date(endDate).getTime() - 6 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0];
          break;
        case "w":
          currentStart = new Date(
            new Date(endDate).getTime() - 27 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0];
          break;
        case "m":
          currentStart = new Date(
            new Date(endDate).getTime() - 364 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0];
          break;
        case "y":
          currentStart = new Date(
            new Date(endDate).getTime() - 1094 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0];
          break;
        default:
          currentStart = new Date(
            new Date(endDate).getTime() - 6 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0];
      }

      const calculation = calculatePreviousPeriodWithGranularity(
        currentStart,
        endDate,
        granularity
      );
      const ranges = {
        current: calculation.currentRange,
        previous: calculation.prevRange,
      };

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
