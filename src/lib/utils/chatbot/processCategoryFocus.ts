/**
 * Procesador de datos de chatbot con foco en categoría
 */

import { matchesCategory } from "@/lib/taxonomy/categoryMatching";
import type { Granularity } from "@/lib/types";
import { generateTimeAxis } from "@/lib/utils/data/timeAxis";
import { computeRangesByGranularity } from "@/lib/utils/time/granularityRanges";
import { chatbotTimeToISO, chatbotTimeToMonth } from "./timeHelpers";

type ChatbotEntry = { time: string; value: number };
type ChatbotData = Record<string, ChatbotEntry[]>;

export function processCategoryFocus(
  config: {
    granularity: Granularity;
    currentRange: { start: string; end: string };
    prevRange: { start: string; end: string };
    categoryId: string;
  },
  inputData: { output?: ChatbotData } | null
): {
  series: {
    current: Array<{ label: string; value: number }>;
    previous: Array<{ label: string; value: number }>;
  };
  donutData: Array<{ label: string; value: number }>;
} {
  const { granularity, currentRange, prevRange, categoryId } = config;

  // Calcular rango específico para donut (KPI)
  const donutRange = computeRangesByGranularity(granularity, currentRange.end);

  // Generar ejes temporales
  const currentLabels = generateTimeAxis(
    granularity,
    currentRange.start,
    currentRange.end
  );
  const previousLabels = generateTimeAxis(
    granularity,
    prevRange.start,
    prevRange.end
  );

  if (!inputData?.output) {
    return {
      series: {
        current: currentLabels.map((label) => ({ label, value: 0 })),
        previous: previousLabels.map((label) => ({ label, value: 0 })),
      },
      donutData: [],
    };
  }

  // Inicializar contadores
  const currentSeries: Record<string, number> = {};
  const previousSeries: Record<string, number> = {};
  const donutCounts: Record<string, number> = {};

  currentLabels.forEach((label) => {
    currentSeries[label] = 0;
  });
  previousLabels.forEach((label) => {
    previousSeries[label] = 0;
  });

  // Procesar cada entrada del chatbot
  for (const [path, entries] of Object.entries(inputData.output)) {
    if (!matchesCategory(path, categoryId)) continue;

    for (const entry of entries) {
      const { time, value } = entry;
      const dateStr = chatbotTimeToISO(time);

      if (granularity === "y") {
        const monthLabel = chatbotTimeToMonth(time);

        if (dateStr >= currentRange.start && dateStr <= currentRange.end) {
          if (currentSeries[monthLabel] !== undefined) {
            currentSeries[monthLabel] += value;
          }
        }

        if (dateStr >= prevRange.start && dateStr <= prevRange.end) {
          if (previousSeries[monthLabel] !== undefined) {
            previousSeries[monthLabel] += value;
          }
        }
      } else {
        if (dateStr >= currentRange.start && dateStr <= currentRange.end) {
          if (currentSeries[dateStr] !== undefined) {
            currentSeries[dateStr] += value;
          }
        }

        if (dateStr >= prevRange.start && dateStr <= prevRange.end) {
          if (previousSeries[dateStr] !== undefined) {
            previousSeries[dateStr] += value;
          }
        }
      }

      // Acumular para donut
      if (
        dateStr >= donutRange.current.start &&
        dateStr <= donutRange.current.end
      ) {
        const pathParts = path.split(".");
        let subcategoryLabel = "Otros";

        if (pathParts.length >= 3) {
          const categoryIndex = pathParts.findIndex((part) =>
            matchesCategory(part, categoryId)
          );

          if (categoryIndex === 1) {
            if (pathParts.length > 2) {
              subcategoryLabel = pathParts[2];
            }
          } else if (categoryIndex === 2) {
            subcategoryLabel = pathParts[1];
          } else if (categoryIndex > 2) {
            subcategoryLabel = pathParts.slice(1, categoryIndex).join(".");
          }
        }

        donutCounts[subcategoryLabel] =
          (donutCounts[subcategoryLabel] || 0) + value;
      }
    }
  }

  // Convertir a formato final
  const currentSeriesArray = currentLabels.map((label) => ({
    label,
    value: currentSeries[label] || 0,
  }));

  const previousSeriesArray = previousLabels.map((label) => ({
    label,
    value: previousSeries[label] || 0,
  }));

  const donutDataArray = Object.entries(donutCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.label.localeCompare(b.label);
    });

  return {
    series: {
      current: currentSeriesArray,
      previous: previousSeriesArray,
    },
    donutData: donutDataArray,
  };
}
