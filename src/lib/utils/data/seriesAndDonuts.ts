/**
 * /lib/utils/seriesAndDonuts.ts
 * Utilidades para generar series temporales y donuts reutilizables
 */

import type { Granularity } from "@/lib/types";
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
