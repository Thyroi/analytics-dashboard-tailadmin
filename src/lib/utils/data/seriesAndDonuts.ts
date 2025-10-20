/**
 * /lib/utils/seriesAndDonuts.ts
 * Utilidades para generar series temporales y donuts reutilizables
 */

import type { Granularity } from "@/lib/types";
import { computeRangesByGranularity } from "@/lib/utils/time/granularityRanges";
import { safeUrlPathname } from "../routing/pathMatching";

// Tipo para filas de GA4
export type GA4Row = {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
};

/**
 * Parsea fechas de GA4 según granularidad
 */
function parseGA4Date(dateRaw: string, granularity: string): string {
  if (granularity === "y") {
    // Para granularidad anual, GA4 devuelve YYYYMM
    return dateRaw.length === 6
      ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}`
      : dateRaw;
  } else {
    // Para otras granularidades, GA4 devuelve YYYYMMDD
    return dateRaw.length === 8
      ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`
      : dateRaw;
  }
}

/**
 * Mapea datos de GA4 a series temporales con lógica de desplazamiento genérica
 */
function mapToTemporalSeries<T>(
  rows: GA4Row[],
  categoryMatcher: (path: string) => T | null,
  targetCategory: T,
  ranges: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  },
  xLabels: string[],
  granularity: string
): {
  currentSeries: number[];
  previousSeries: number[];
  totalCurrent: number;
  totalPrevious: number;
} {
  const currentSeries = new Array(xLabels.length).fill(0);
  const previousSeries = new Array(xLabels.length).fill(0);

  let totalCurrent = 0;
  let totalPrevious = 0;

  for (const r of rows) {
    const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
    if (!dateRaw) continue;

    const iso = parseGA4Date(dateRaw, granularity);
    const url = String(r.dimensionValues?.[1]?.value ?? "");
    const path = safeUrlPathname(url);
    const value = Number(r.metricValues?.[0]?.value ?? 0);

    // Verificar que la URL corresponde a nuestra categoría
    const matchedCategory = categoryMatcher(path);
    if (matchedCategory !== targetCategory) continue;

    // Generar timeKey según granularidad
    const timeKey = granularity === "y" ? iso : iso; // Para yearly ya viene como YYYY-MM

    // Mapear a current series
    if (iso >= ranges.current.start && iso <= ranges.current.end) {
      const timeIndex = xLabels.indexOf(timeKey);
      if (timeIndex >= 0) {
        currentSeries[timeIndex] += value;
      }
      totalCurrent += value;
    }

    // Mapear a previous series (NO EXCLUSIVO - una fecha puede estar en ambos)
    if (iso >= ranges.previous.start && iso <= ranges.previous.end) {
      if (granularity === "y") {
        // Para yearly, los datos vienen como YYYY-MM y los rangos como YYYY-MM-DD
        // Necesitamos comparar solo año-mes
        const currentStartYM = ranges.current.start.slice(0, 7); // "2024-10"
        const currentEndYM = ranges.current.end.slice(0, 7); // "2025-10"
        const isoYM = iso; // Ya viene como "2025-09"

        // Verificar si este mes está en el current range
        if (isoYM >= currentStartYM && isoYM <= currentEndYM) {
          // Encontrar la posición en xLabels
          const timeIndex = xLabels.indexOf(isoYM);
          if (timeIndex >= 0) {
            // Para previous, ese mismo mes va una posición adelante (shift de 1 mes)
            const targetIndex = timeIndex + 1;
            if (targetIndex < xLabels.length) {
              previousSeries[targetIndex] += value;
            }
          }
        }
      } else {
        // Para otras granularidades, calcular diferencia en días
        const previousStart = new Date(ranges.previous.start);
        const currentDate = new Date(iso);
        const daysFromPrevStart = Math.floor(
          (currentDate.getTime() - previousStart.getTime()) /
            (24 * 60 * 60 * 1000)
        );

        if (daysFromPrevStart >= 0 && daysFromPrevStart < xLabels.length) {
          previousSeries[daysFromPrevStart] += value;
        }
      }

      totalPrevious += value;
    }
  }

  return {
    currentSeries,
    previousSeries,
    totalCurrent,
    totalPrevious,
  };
}

/**
 * Genera el eje temporal (xLabels) según la granularidad
 */
export function generateTimeAxis(
  granularity: Granularity,
  currentStart: string,
  currentEnd: string
): string[] {
  const isYearly = granularity === "y";

  if (isYearly) {
    // Para granularidad anual, generar labels por mes (YYYY-MM)
    const labels: string[] = [];
    const start = new Date(currentStart);
    const end = new Date(currentEnd);

    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endDate = new Date(end);
    while (current <= endDate) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      labels.push(`${year}-${month}`);
      current.setMonth(current.getMonth() + 1);
    }

    return labels;
  } else {
    // Para otras granularidades, generar labels por día (YYYY-MM-DD)
    const labels: string[] = [];
    const start = new Date(currentStart);
    const end = new Date(currentEnd);

    const current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      labels.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }

    return labels;
  }
}

/**
 * Función genérica para construir series temporales (reemplaza buildTimeSeriesForCategory)
 */
export function buildTimeSeriesForCategory<T>(
  rows: GA4Row[],
  categoryMatcher: (path: string) => T | null,
  targetCategory: T,
  ranges: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  },
  xLabels: string[],
  granularity: Granularity
): {
  currentSeries: number[];
  previousSeries: number[];
  totalCurrent: number;
  totalPrevious: number;
} {
  return mapToTemporalSeries(
    rows,
    categoryMatcher,
    targetCategory,
    ranges,
    xLabels,
    granularity
  );
}

/**
 * Construye datos para donut de pueblos
 */
export function buildTownsDonutForCategory<T>(
  rows: GA4Row[],
  categoryMatcher: (path: string) => T | null,
  targetCategory: T,
  townMatcher: (path: string) => string | null,
  donutStart: string,
  donutEnd: string,
  granularity: string
): Array<{ label: string; value: number }> {
  const townCounts: Record<string, number> = {};

  for (const r of rows) {
    const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
    if (!dateRaw) continue;

    const iso = parseGA4Date(dateRaw, granularity);
    const url = String(r.dimensionValues?.[1]?.value ?? "");
    const path = safeUrlPathname(url);
    const value = Number(r.metricValues?.[0]?.value ?? 0);

    // Filtrar por rango de fechas PRIMERO
    if (iso < donutStart || iso > donutEnd) continue;

    // Filtrar por categoría - DEBE coincidir con la categoría objetivo
    const matchedCategory = categoryMatcher(path);
    if (matchedCategory !== targetCategory) continue;

    // Extraer pueblo de la URL
    const town = townMatcher(path);
    if (town) {
      townCounts[town] = (townCounts[town] || 0) + value;
    }
  }

  return Object.entries(townCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Función específica para series temporales de pueblos
 */
export function buildTimeSeriesForTown<T>(
  rows: GA4Row[],
  townMatcher: (path: string) => T | null,
  targetTown: T,
  ranges: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  },
  xLabels: string[],
  granularity: Granularity
): {
  currentSeries: number[];
  previousSeries: number[];
  totalCurrent: number;
  totalPrevious: number;
} {
  return mapToTemporalSeries(
    rows,
    townMatcher,
    targetTown,
    ranges,
    xLabels,
    granularity
  );
}

/**
 * Construye datos para donut de categorías para un pueblo específico
 */
export function buildCategoriesDonutForTown<T>(
  rows: GA4Row[],
  townMatcher: (path: string) => T | null,
  targetTown: T,
  categoryMatcher: (path: string) => string | null,
  donutStart: string,
  donutEnd: string,
  granularity: string
): Array<{ label: string; value: number }> {
  const categoryCounts: Record<string, number> = {};

  for (const r of rows) {
    const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
    if (!dateRaw) continue;

    const iso = parseGA4Date(dateRaw, granularity);
    const url = String(r.dimensionValues?.[1]?.value ?? "");
    const path = safeUrlPathname(url);
    const value = Number(r.metricValues?.[0]?.value ?? 0);

    // Filtrar por rango de fechas PRIMERO
    if (iso < donutStart || iso > donutEnd) continue;

    // Filtrar por pueblo - DEBE coincidir con el pueblo objetivo
    const matchedTown = townMatcher(path);
    if (matchedTown !== targetTown) continue;

    // Extraer categoría de la URL
    const category = categoryMatcher(path);
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + value;
    }
  }

  return Object.entries(categoryCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Construye datos para donut de URLs para un pueblo y categoría específicos
 */
export function buildUrlsDonutForTownCategory<T>(
  rows: GA4Row[],
  townMatcher: (path: string) => T | null,
  targetTown: T,
  categoryMatcher: (path: string) => string | null,
  targetCategory: string,
  donutStart: string,
  donutEnd: string,
  granularity: string
): Array<{ label: string; value: number }> {
  const urlCounts: Record<string, number> = {};

  for (const r of rows) {
    const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
    if (!dateRaw) continue;

    const iso = parseGA4Date(dateRaw, granularity);
    const url = String(r.dimensionValues?.[1]?.value ?? "");
    const path = safeUrlPathname(url);
    const value = Number(r.metricValues?.[0]?.value ?? 0);

    // Filtrar por pueblo, categoría y rango de fechas
    const matchedTown = townMatcher(path);
    if (matchedTown !== targetTown) continue;

    if (iso < donutStart || iso > donutEnd) continue;

    const category = categoryMatcher(path);
    if (category !== targetCategory) continue;

    // Usar la URL completa como etiqueta
    if (url) {
      urlCounts[url] = (urlCounts[url] || 0) + value;
    }
  }

  return Object.entries(urlCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Formatea series para respuesta API
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

export function buildUrlsDonutForCategoryTown<T>(
  rows: GA4Row[],
  categoryMatcher: (path: string) => string | null,
  targetCategory: string,
  townMatcher: (path: string) => T | null,
  targetTown: T,
  donutStart: string,
  donutEnd: string,
  granularity: string
): Array<{ label: string; value: number }> {
  const urlCounts: Record<string, number> = {};

  for (const r of rows) {
    const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
    if (!dateRaw) continue;

    const iso = parseGA4Date(dateRaw, granularity);
    const url = String(r.dimensionValues?.[1]?.value ?? "");
    const path = safeUrlPathname(url);
    const value = Number(r.metricValues?.[0]?.value ?? 0);

    // Filtrar por rango de fechas PRIMERO
    if (iso < donutStart || iso > donutEnd) continue;

    // Filtrar por categoría
    const category = categoryMatcher(path);
    if (category !== targetCategory) continue;

    // Filtrar por pueblo
    const matchedTown = townMatcher(path);
    if (matchedTown !== targetTown) continue;

    // Usar la URL completa como etiqueta
    if (url) {
      urlCounts[url] = (urlCounts[url] || 0) + value;
    }
  }

  return Object.entries(urlCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
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
 * Basada en los parámetros que requiere nuestro caso de uso específico
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

    // Procesar cada entrada del chatbot
    for (const [path, entries] of Object.entries(inputData.output)) {
      // Verificar si el path contiene el pueblo objetivo
      // Formato: "root.almonte.playas" o "root.almonte.naturaleza.parques"
      const pathLower = path.toLowerCase();
      const townLower = targetTown.toLowerCase();

      if (!pathLower.includes(townLower)) continue;

      // Procesar cada entrada temporal
      for (const entry of entries as Array<{ time: string; value: number }>) {
        const { time, value } = entry;

        // Convertir time de "20251015" a "2025-10-15"
        const dateStr = `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(
          6,
          8
        )}`;

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

        // Para donut, acumular por categoría usando el rango específico para KPI
        if (
          dateStr >= donutRange.current.start &&
          dateStr <= donutRange.current.end
        ) {
          const pathParts = path.split(".");
          let categoryLabel = "Otros";

          // Ejemplos de paths:
          // "root.almonte.playas" -> category: "playas"
          // "root.almonte.naturaleza.parques" -> category: "naturaleza"
          // "root.almonte.cultura.museos" -> category: "cultura"

          if (pathParts.length >= 3) {
            // Buscar el índice donde aparece el pueblo objetivo
            const townIndex = pathParts.findIndex((part) =>
              part.toLowerCase().includes(townLower)
            );

            if (townIndex === 1 && pathParts.length > 2) {
              // Formato: "root.almonte.categoria" - la categoría está después del pueblo
              categoryLabel = pathParts[2];
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
