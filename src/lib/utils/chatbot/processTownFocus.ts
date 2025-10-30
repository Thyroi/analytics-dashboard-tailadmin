/**
 * Procesador de datos de chatbot con foco en pueblo/town
 */

import { getCategoryLabel } from "@/lib/taxonomy/categories";
import { TOWN_SYNONYMS } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { detectTownAndCategoryFromPath } from "@/lib/utils/chatbot/aggregate";
import { generateTimeAxis } from "@/lib/utils/data/timeAxis";
import { computeRangesByGranularity } from "@/lib/utils/time/granularityRanges";
import { chatbotTimeToISO, chatbotTimeToMonth } from "./timeHelpers";

type ChatbotEntry = { time: string; value: number };
type ChatbotData = Record<string, ChatbotEntry[]>;

const FRIENDLY_CATEGORY_LABELS: Record<string, string> = {
  naturaleza: "Naturaleza",
  fiestasTradiciones: "Fiestas y Tradiciones",
  playas: "Playas",
  espaciosMuseisticos: "Espacios Museísticos",
  patrimonio: "Patrimonio",
  rutasCulturales: "Rutas Culturales",
  rutasSenderismo: "Rutas Senderismo",
  sabor: "Sabor",
  donana: "Doñana",
  circuitoMonteblanco: "Circuito Monteblanco",
  laRabida: "La Rábida",
  lugaresColombinos: "Lugares Colombinos",
  otros: "Otros",
};

export function processTownFocus(
  config: {
    granularity: Granularity;
    currentRange: { start: string; end: string };
    prevRange: { start: string; end: string };
    townId: string;
  },
  inputData: { output?: ChatbotData } | null
): {
  series: {
    current: Array<{ label: string; value: number }>;
    previous: Array<{ label: string; value: number }>;
  };
  donutData: Array<{ label: string; value: number }>;
} {
  const { granularity, currentRange, prevRange, townId } = config;

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

  // Construir índice de sinónimos de towns
  const townIndex = new Map<string, string>();
  const normalize = (s: string) => s.toLowerCase().trim();

  Object.entries(TOWN_SYNONYMS).forEach(([tid, synonyms]) => {
    townIndex.set(normalize(tid), tid);
    synonyms.forEach((synonym) => {
      townIndex.set(normalize(synonym), tid);
    });
  });

  // Procesar cada entrada del chatbot
  for (const [path, entries] of Object.entries(inputData.output)) {
    const segments = path.startsWith("root.")
      ? path.slice(5).split(".")
      : path.split(".");

    // Buscar el town en los segmentos
    let pathMatchesTargetTown = false;

    for (const segment of segments) {
      const normalizedSegment = normalize(segment);
      const matchedTown = townIndex.get(normalizedSegment);

      if (matchedTown === townId || normalizedSegment === normalize(townId)) {
        pathMatchesTargetTown = true;
        break;
      }
    }

    if (!pathMatchesTargetTown) continue;

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

      // Acumular para donut por categoría
      if (
        dateStr >= donutRange.current.start &&
        dateStr <= donutRange.current.end
      ) {
        const pathParts = path.split(".");
        let categoryLabel = "Otros";

        if (pathParts.length >= 3) {
          const detected = detectTownAndCategoryFromPath(path);

          if (detected.townId === townId && detected.categoryId) {
            categoryLabel =
              FRIENDLY_CATEGORY_LABELS[detected.categoryId] ||
              getCategoryLabel(detected.categoryId);
          }
        }

        donutCounts[categoryLabel] = (donutCounts[categoryLabel] || 0) + value;
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
