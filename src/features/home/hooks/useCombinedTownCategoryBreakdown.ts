"use client";

import { usePuebloDetails } from "@/features/analytics/hooks/pueblos/usePuebloDetails";
import { useChatbotTownDetails } from "@/features/chatbot/hooks/useChatbotTownDetails";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useMemo } from "react";

/**
 * Hook que combina datos de GA4 (via usePuebloDetails) y Chatbot (via useChatbotTownDetails)
 * para un pueblo específico, normalizando labels para detectar duplicados.
 *
 * Usado en:
 * - Home page delta section (muestra combined total por pueblo)
 * - Drilldown de pueblo (muestra donut combinado de categorías)
 */
export function useCombinedTownCategoryBreakdown(
  townId: TownId | null,
  granularity: Granularity,
  startDate: string,
  endDate: string
) {
  // Fetch GA4 data
  const ga4Result = usePuebloDetails({
    townId: townId!,
    granularity,
    startDate,
    endDate,
    enabled: !!townId && !!startDate && !!endDate,
  });

  // Fetch Chatbot data usando el hook correcto con buildSeriesAndDonutFocused
  const chatbotResult = useChatbotTownDetails({
    townId: townId!,
    granularity,
    startDate,
    endDate,
    enabled: !!townId && !!startDate && !!endDate,
  }); // Helper: normalizar label para detectar duplicados
  const normalizeLabel = (label: string): string => {
    return label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/\s+(y|de|del|la|el|los|las)\s+/g, " ") // Remove common conjunctions/articles (WITH spaces)
      .replace(/\s+/g, "") // THEN remove all whitespace
      .replace(/[^a-z0-9]/g, "") // Remove non-alphanumeric characters
      .trim();
  };

  // Combinar series: GA4 + Chatbot
  const combinedSeries = useMemo(() => {
    const ga4Series = ga4Result.series || { current: [], previous: [] };
    const chatbotSeries = chatbotResult.series || { current: [], previous: [] };

    // Combinar current
    const currentMap = new Map<string, number>();
    ga4Series.current.forEach((point: SeriesPoint) => {
      currentMap.set(
        point.label,
        (currentMap.get(point.label) || 0) + point.value
      );
    });
    chatbotSeries.current.forEach((point: SeriesPoint) => {
      currentMap.set(
        point.label,
        (currentMap.get(point.label) || 0) + point.value
      );
    });

    const current = Array.from(currentMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => {
        // Sort by date (label is YYYY-MM-DD)
        return a.label.localeCompare(b.label);
      });

    // Combinar previous
    const previousMap = new Map<string, number>();
    ga4Series.previous.forEach((point: SeriesPoint) => {
      previousMap.set(
        point.label,
        (previousMap.get(point.label) || 0) + point.value
      );
    });
    chatbotSeries.previous.forEach((point: SeriesPoint) => {
      previousMap.set(
        point.label,
        (previousMap.get(point.label) || 0) + point.value
      );
    });

    const previous = Array.from(previousMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => {
        return a.label.localeCompare(b.label);
      });

    return { current, previous };
  }, [ga4Result.series, chatbotResult.series]);

  // Combinar donuts: GA4 + Chatbot con normalización para detectar duplicados
  const combinedDonut = useMemo(() => {
    const ga4Donut = ga4Result.donutData || [];
    const chatbotDonut = chatbotResult.donutData || [];

    // Mapa para combinar valores: key = normalized label (para unificar variantes), value = { originalLabel, totalValue }
    // IMPORTANTE: Usar label normalizado como key permite unificar:
    // - "espaciosMuseisticos" + "Espacios Museísticos" → "espaciosmuseisticos" (misma key)
    // - "fiestasTradiciones" + "Fiestas y Tradiciones" → "fiestatradiciones" (misma key después de normalizar)
    const combinedMap = new Map<string, { label: string; value: number }>();

    // Agregar GA4 donut
    ga4Donut.forEach((item: DonutDatum) => {
      const normalized = normalizeLabel(item.label);
      const existing = combinedMap.get(normalized);
      if (existing) {
        // Si ya existe, sumar al valor y preferir el label más descriptivo (el más largo)
        existing.value += item.value;
        if (item.label.length > existing.label.length) {
          existing.label = item.label;
        }
      } else {
        combinedMap.set(normalized, {
          label: item.label, // Usar el label original de GA4
          value: item.value,
        });
      }
    });

    // Agregar Chatbot donut
    chatbotDonut.forEach((item: { label: string; value: number }) => {
      const normalized = normalizeLabel(item.label);
      const existing = combinedMap.get(normalized);
      if (existing) {
        // Si ya existe, sumar al valor y preferir el label más descriptivo (el más largo)
        existing.value += item.value;
        if (item.label.length > existing.label.length) {
          existing.label = item.label;
        }
      } else {
        combinedMap.set(normalized, {
          label: item.label,
          value: item.value,
        });
      }
    });

    // CONSOLIDAR "Otros": detectar y combinar todas las entradas "Otros"
    const otrosEntries: Array<{ label: string; value: number }> = [];
    const regularEntries: Array<{ label: string; value: number }> = [];

    for (const entry of combinedMap.values()) {
      const labelLower = entry.label.toLowerCase().trim();
      const isOtros =
        labelLower === "otros" ||
        labelLower.startsWith("otros ") ||
        labelLower.startsWith("otros(");

      if (isOtros) {
        otrosEntries.push(entry);
      } else {
        regularEntries.push(entry);
      }
    }

    // Si hay múltiples "Otros", consolidarlos en uno solo
    if (otrosEntries.length > 0) {
      const totalOtros = otrosEntries.reduce((sum, e) => sum + e.value, 0);
      regularEntries.push({
        label: "Otros",
        value: totalOtros,
      });
    }

    // Ordenar por valor descendente
    return regularEntries.sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.label.localeCompare(b.label);
    });
  }, [ga4Result.donutData, chatbotResult.donutData]);

  // Calcular totales para verificar si hay datos sin categorizar
  const totalsInfo = useMemo(() => {
    // Totales de los donuts (solo categorizados)
    const ga4DonutTotal = (ga4Result.donutData || []).reduce(
      (sum, item) => sum + item.value,
      0
    );
    const chatbotDonutTotal = (chatbotResult.donutData || []).reduce(
      (sum, item) => sum + item.value,
      0
    );

    // Totales de las series (incluye todo)
    const ga4SeriesTotal = (ga4Result.series?.current || []).reduce(
      (sum, point) => sum + point.value,
      0
    );
    const chatbotSeriesTotal = (chatbotResult.series?.current || []).reduce(
      (sum, point) => sum + point.value,
      0
    );

    const ga4Uncategorized = ga4SeriesTotal - ga4DonutTotal;
    const chatbotUncategorized = chatbotSeriesTotal - chatbotDonutTotal;

    return {
      ga4DonutTotal,
      ga4SeriesTotal,
      ga4Uncategorized,
      chatbotDonutTotal,
      chatbotSeriesTotal,
      chatbotUncategorized,
    };
  }, [
    ga4Result.donutData,
    ga4Result.series,
    chatbotResult.donutData,
    chatbotResult.series,
  ]);

  // Estado combinado: esperar a que AMBOS terminen para evitar renders parciales
  // Verificar que ambas queries hayan completado (exitosamente o sin datos)
  const ga4IsReady =
    ga4Result.status === "ready" || ga4Result.status === "fetching";
  const chatbotIsReady = !chatbotResult.isLoading;

  // Solo marcamos como "not loading" cuando AMBAS queries terminaron
  // Esto previene el flickering (12→270→300) cuando una termina antes que la otra
  const isLoading = !ga4IsReady || !chatbotIsReady;
  const isError = ga4Result.status === "error" || chatbotResult.isError;

  return {
    series: combinedSeries,
    donutData: combinedDonut,
    isLoading,
    isError,
    ga4Result,
    chatbotResult,
    totalsInfo, // Info de debug sobre totales
  };
}
