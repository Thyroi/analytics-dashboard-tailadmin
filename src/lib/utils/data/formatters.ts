/**
 * /lib/utils/data/formatters.ts
 * Formateo de series y funciones especializadas para chatbot
 */

import { getCategoryLabel } from "@/lib/taxonomy/categories";
import { TOWN_SYNONYMS } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { detectTownAndCategoryFromPath } from "@/lib/utils/chatbot/aggregate";
import { computeRangesByGranularity } from "@/lib/utils/time/granularityRanges";
import { generateTimeAxis } from "./timeAxis";

/**
 * Formatea series numéricas a formato de respuesta API
 *
 * @param currentSeries - Array de valores para el período actual
 * @param previousSeries - Array de valores para el período anterior
 * @param xLabels - Etiquetas del eje X (para current)
 * @param ranges - Rangos temporales (opcional, para generar labels de previous)
 * @param granularity - Granularidad temporal (opcional)
 * @returns Objeto con series formateadas { current, previous }
 *
 * @example
 * const formatted = formatSeries(
 *   [100, 150, 200],
 *   [80, 120, 180],
 *   ['2025-10-01', '2025-10-02', '2025-10-03']
 * );
 * // { current: [{ label: '2025-10-01', value: 100 }, ...], previous: [...] }
 */
export function formatSeries(
  currentSeries: number[],
  previousSeries: number[],
  xLabels: string[],
  ranges?: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  },
  granularity?: string
): {
  current: Array<{ label: string; value: number }>;
  previous: Array<{ label: string; value: number }>;
} {
  // Generar etiquetas para previous series si se proporcionan los rangos
  let previousLabels = xLabels;

  if (ranges && granularity) {
    previousLabels = generateTimeAxis(
      granularity as Granularity,
      ranges.previous.start,
      ranges.previous.end
    );
  }

  return {
    current: currentSeries.map((value, i) => ({
      label: xLabels[i],
      value,
    })),
    previous: previousSeries.map((value, i) => ({
      label: previousLabels[i] || xLabels[i], // fallback a current labels si no hay previous
      value,
    })),
  };
}

/**
 * Helper para verificar si un path/texto contiene una categoría específica
 * Maneja casos especiales con diferentes variantes ortográficas
 */
function matchesCategory(text: string, targetCategory: string): boolean {
  const textLower = text.toLowerCase();

  if (targetCategory === "espaciosMuseisticos") {
    return (
      textLower.includes("espacios") &&
      (textLower.includes("museisticos") ||
        textLower.includes("museísticos") ||
        textLower.includes("museíticos") ||
        textLower.includes("museiticos"))
    );
  } else if (targetCategory === "fiestasTradiciones") {
    return (
      textLower.includes("fiestas") ||
      textLower.includes("festivals") ||
      (textLower.includes("fiestas") && textLower.includes("tradiciones"))
    );
  } else if (targetCategory === "rutasCulturales") {
    return (
      (textLower.includes("rutas") && textLower.includes("culturales")) ||
      textLower.includes("rutas_culturales") ||
      textLower.includes("rutas-culturales") ||
      textLower.includes("cultural-routes") ||
      textLower.includes("cultural_routes") ||
      // Caso especial: "rutas" a secas también puede ser cultural (según comentario en taxonomy)
      (textLower.includes("root.rutas") && !textLower.includes("senderismo"))
    );
  } else if (targetCategory === "rutasSenderismo") {
    return (
      textLower.includes("senderismo") ||
      textLower.includes("hiking") ||
      textLower.includes("btt") ||
      textLower.includes("vias-verdes") ||
      textLower.includes("vias_verdes") ||
      textLower.includes("vías") ||
      (textLower.includes("rutas") && textLower.includes("senderismo")) ||
      (textLower.includes("rutas") && textLower.includes("cicloturistas")) ||
      textLower.includes("rutas-senderismo") ||
      textLower.includes("rutas_senderismo") ||
      textLower.includes("hiking-and-cycling") ||
      textLower.includes("hiking_and_cycling")
    );
  } else if (targetCategory === "circuitoMonteblanco") {
    return (
      textLower.includes("monteblanco") ||
      textLower.includes("circuito-monteblanco") ||
      textLower.includes("circuito_monteblanco") ||
      (textLower.includes("circuito") && textLower.includes("monteblanco"))
    );
  } else if (targetCategory === "laRabida") {
    return (
      textLower.includes("rabida") ||
      textLower.includes("rábida") ||
      textLower.includes("la-rabida") ||
      textLower.includes("la_rabida") ||
      textLower.includes("larabida") ||
      (textLower.includes("la") && textLower.includes("rabida")) ||
      (textLower.includes("la") && textLower.includes("rábida"))
    );
  } else if (targetCategory === "lugaresColombinos") {
    return (
      textLower.includes("colombinos") ||
      textLower.includes("lugares-colombinos") ||
      textLower.includes("lugares_colombinos") ||
      (textLower.includes("lugares") && textLower.includes("colombinos"))
    );
  } else {
    return textLower.includes(targetCategory.toLowerCase());
  }
}

/**
 * Función enfocada para construir series y donut para chatbot data
 *
 * Procesa datos raw del chatbot y genera series temporales + donut charts
 * según el enfoque (categoría o pueblo). Maneja granularidades y rangos.
 *
 * @param config - Configuración con granularidad, rangos y enfoque
 * @param inputData - Datos raw del chatbot en formato ApiResponse
 * @returns Series temporales y datos para donut chart
 *
 * @example
 * const result = buildSeriesAndDonutFocused(
 *   {
 *     granularity: 'd',
 *     currentRange: { start: '2025-10-01', end: '2025-10-31' },
 *     prevRange: { start: '2024-10-01', end: '2024-10-31' },
 *     focus: { type: 'category', id: 'playas' }
 *   },
 *   chatbotApiResponse
 * );
 * // { series: { current: [...], previous: [...] }, donutData: [...] }
 */
export function buildSeriesAndDonutFocused(
  config: {
    granularity: Granularity;
    currentRange: { start: string; end: string };
    prevRange: { start: string; end: string };
    focus: { type: "category" | "town"; id: string };
  },
  inputData: Record<string, unknown> | null // Datos raw del chatbot en formato ApiResponse
): {
  series: {
    current: Array<{ label: string; value: number }>;
    previous: Array<{ label: string; value: number }>;
  };
  donutData: Array<{ label: string; value: number }>;
} {
  const { granularity, currentRange, prevRange, focus } = config;

  // Calcular rango específico para donut (KPI) usando las reglas de granularidad
  // Para granularidad 'd': solo último día del período current
  // Para otras granularidades: usar el rango completo current
  const donutRange = computeRangesByGranularity(granularity, currentRange.end);

  // Generar ejes temporales separados para current y previous
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

  // Si focus es category, procesamos datos del chatbot
  if (focus.type === "category") {
    const targetCategory = focus.id; // ej: "playas", "naturaleza", etc.

    if (!inputData?.output) {
      return {
        series: {
          current: currentLabels.map((label) => ({ label, value: 0 })),
          previous: previousLabels.map((label) => ({ label, value: 0 })),
        },
        donutData: [],
      };
    }

    // Procesar series temporales
    const currentSeries: Record<string, number> = {};
    const previousSeries: Record<string, number> = {};
    const donutCounts: Record<string, number> = {};

    // Inicializar series con 0 usando sus respectivos labels
    currentLabels.forEach((label) => {
      currentSeries[label] = 0;
    });
    previousLabels.forEach((label) => {
      previousSeries[label] = 0;
    });

    // Procesar cada entrada del chatbot
    for (const [path, entries] of Object.entries(inputData.output)) {
      // Verificar si el path contiene la categoría objetivo
      // Formato: "root.playas.accesos" o "root.almonte.playas" o "root.genéricas del condado.playas.accesos"
      if (!matchesCategory(path, targetCategory)) continue;

      // Procesar cada entrada temporal
      for (const entry of entries as Array<{ time: string; value: number }>) {
        const { time, value } = entry;

        // Convertir time de "20251015" a "2025-10-15" para comparaciones de rango
        const dateStr = `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(
          6,
          8
        )}`;

        // Para granularidad "y", los datos vienen como YYYYMMDD pero necesitamos agrupar por YYYYMM
        if (granularity === "y") {
          // Convertir YYYYMMDD a YYYY-MM para que coincida con las etiquetas de las series
          const monthLabel = `${time.slice(0, 4)}-${time.slice(4, 6)}`; // YYYY-MM

          // Verificar si está en rango current
          if (dateStr >= currentRange.start && dateStr <= currentRange.end) {
            if (currentSeries[monthLabel] !== undefined) {
              currentSeries[monthLabel] += value;
            }
          }

          // Verificar si está en rango previous
          if (dateStr >= prevRange.start && dateStr <= prevRange.end) {
            if (previousSeries[monthLabel] !== undefined) {
              previousSeries[monthLabel] += value;
            }
          }
        } else {
          // Para otras granularidades, usar el formato normal
          // Verificar si está en rango current
          if (dateStr >= currentRange.start && dateStr <= currentRange.end) {
            if (currentSeries[dateStr] !== undefined) {
              currentSeries[dateStr] += value;
            }
          }

          // Verificar si está en rango previous
          if (dateStr >= prevRange.start && dateStr <= prevRange.end) {
            if (previousSeries[dateStr] !== undefined) {
              previousSeries[dateStr] += value;
            }
          }
        }

        // Para donut, acumular por subcategoría usando el rango específico para KPI
        if (
          dateStr >= donutRange.current.start &&
          dateStr <= donutRange.current.end
        ) {
          const pathParts = path.split(".");
          let subcategoryLabel = "Otros";

          // Ejemplos de paths:
          // "root.playas.accesos" -> subcategory: "accesos"
          // "root.almonte.playas" -> subcategory: "almonte"
          // "root.genéricas del condado.playas.accesos" -> subcategory: "genéricas del condado"

          if (pathParts.length >= 3) {
            // Buscar el índice donde aparece la categoría objetivo
            const categoryIndex = pathParts.findIndex((part) =>
              matchesCategory(part, targetCategory)
            );

            if (categoryIndex === 1) {
              // Formato: "root.playas.accesos" - la subcategoría está después de la categoría
              if (pathParts.length > 2) {
                subcategoryLabel = pathParts[2];
              }
            } else if (categoryIndex === 2) {
              // Formato: "root.almonte.playas" - el pueblo/lugar está antes de la categoría
              subcategoryLabel = pathParts[1];
            } else if (categoryIndex > 2) {
              // Formato: "root.genéricas del condado.playas.accesos"
              // Tomar todo lo que está antes de la categoría (excepto "root")
              subcategoryLabel = pathParts.slice(1, categoryIndex).join(".");
            }
          }

          donutCounts[subcategoryLabel] =
            (donutCounts[subcategoryLabel] || 0) + value;
        }
      }
    }

    // Convertir a formato requerido
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
        // Primero ordenar por valor descendente
        if (b.value !== a.value) return b.value - a.value;
        // Si tienen el mismo valor, ordenar alfabéticamente para consistencia
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

  // Si focus es town, procesamos datos del chatbot
  if (focus.type === "town") {
    const targetTown = focus.id; // ej: "almonte", "huelva", etc.

    if (!inputData?.output) {
      return {
        series: {
          current: currentLabels.map((label) => ({ label, value: 0 })),
          previous: previousLabels.map((label) => ({ label, value: 0 })),
        },
        donutData: [],
      };
    }

    // Procesar series temporales
    const currentSeries: Record<string, number> = {};
    const previousSeries: Record<string, number> = {};
    const donutCounts: Record<string, number> = {};

    // Inicializar series con 0 usando sus respectivos labels
    currentLabels.forEach((label) => {
      currentSeries[label] = 0;
    });
    previousLabels.forEach((label) => {
      previousSeries[label] = 0;
    });

    // Construir índice de sinónimos de towns usando TOWN_SYNONYMS de taxonomy
    const townIndex = new Map<string, string>();
    const normalize = (s: string) => s.toLowerCase().trim();

    // Usar el arreglo centralizado de sinónimos
    Object.entries(TOWN_SYNONYMS).forEach(([townId, synonyms]) => {
      // Agregar el townId mismo
      townIndex.set(normalize(townId), townId);

      // Agregar todos los sinónimos
      synonyms.forEach((synonym) => {
        townIndex.set(normalize(synonym), townId);
      });
    });

    // Procesar cada entrada del chatbot
    for (const [path, entries] of Object.entries(inputData.output)) {
      // Usar lógica de matching robusta basada en segmentos (como detectTownAndCategory)
      const segments = path.startsWith("root.")
        ? path.slice(5).split(".")
        : path.split(".");

      // Buscar el town en los segmentos usando el índice de sinónimos
      let pathMatchesTargetTown = false;

      for (const segment of segments) {
        const normalizedSegment = normalize(segment);
        const matchedTown = townIndex.get(normalizedSegment);

        // Si este segmento matchea nuestro target town, procesamos esta entrada
        if (matchedTown === targetTown) {
          pathMatchesTargetTown = true;
          break;
        }

        // También verificar match directo con el townId
        if (normalizedSegment === normalize(targetTown)) {
          pathMatchesTargetTown = true;
          break;
        }
      }

      if (!pathMatchesTargetTown) continue;

      // Procesar cada entrada temporal
      for (const entry of entries as Array<{ time: string; value: number }>) {
        const { time, value } = entry;

        // Convertir time de "20251015" a "2025-10-15" para comparaciones de rango
        const dateStr = `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(
          6,
          8
        )}`;

        // Para granularidad "y", los datos vienen como YYYYMMDD pero necesitamos agrupar por YYYYMM
        if (granularity === "y") {
          // Convertir YYYYMMDD a YYYY-MM para que coincida con las etiquetas de las series
          const monthLabel = `${time.slice(0, 4)}-${time.slice(4, 6)}`; // YYYY-MM

          // Verificar si está en rango current
          if (dateStr >= currentRange.start && dateStr <= currentRange.end) {
            if (currentSeries[monthLabel] !== undefined) {
              currentSeries[monthLabel] += value;
            }
          }

          // Verificar si está en rango previous
          if (dateStr >= prevRange.start && dateStr <= prevRange.end) {
            if (previousSeries[monthLabel] !== undefined) {
              previousSeries[monthLabel] += value;
            }
          }
        } else {
          // Para otras granularidades, usar el formato normal
          // Verificar si está en rango current
          if (dateStr >= currentRange.start && dateStr <= currentRange.end) {
            if (currentSeries[dateStr] !== undefined) {
              currentSeries[dateStr] += value;
            }
          }

          // Verificar si está en rango previous
          if (dateStr >= prevRange.start && dateStr <= prevRange.end) {
            if (previousSeries[dateStr] !== undefined) {
              previousSeries[dateStr] += value;
            }
          }
        }

        // Para donut, acumular por categoría usando el rango específico para KPI
        if (
          dateStr >= donutRange.current.start &&
          dateStr <= donutRange.current.end
        ) {
          const pathParts = path.split(".");
          let categoryLabel = "Otros";

          // Usar la lógica robusta de detección para obtener tanto town como category
          if (pathParts.length >= 3) {
            // detectTownAndCategoryFromPath espera el path completo con "root."
            const detected = detectTownAndCategoryFromPath(path);

            // Si detectamos el town correcto y una categoría válida
            if (detected.townId === targetTown && detected.categoryId) {
              // Usar formato CamelCase amigable en lugar de mayúsculas
              const friendlyLabels: Record<string, string> = {
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

              categoryLabel =
                friendlyLabels[detected.categoryId] ||
                getCategoryLabel(detected.categoryId);
            }
          }

          donutCounts[categoryLabel] =
            (donutCounts[categoryLabel] || 0) + value;
        }
      }
    }

    // Convertir a formato requerido
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
        // Primero ordenar por valor descendente
        if (b.value !== a.value) return b.value - a.value;
        // Si tienen el mismo valor, ordenar alfabéticamente para consistencia
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

  // Fallback
  return {
    series: {
      current: [],
      previous: [],
    },
    donutData: [],
  };
}
