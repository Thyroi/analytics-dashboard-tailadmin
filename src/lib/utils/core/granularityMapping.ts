/**
 * /lib/utils/granularityMapping.ts
 * Funciones específicas para mapear datos según granularidad
 * Cada función maneja el comportamiento específico de labels y agregación
 */

import type { Granularity } from "@/lib/types";
import { safeUrlPathname } from "@/lib/utils/routing/pathMatching";
import type { DateRange } from "../time/granularityRanges";

// Función parseGA4Date copiada de seriesAndDonuts.ts para evitar dependencias circulares
function parseGA4Date(dateRaw: string, granularity: string): string {
  if (granularity === "y") {
    // Para granularidad anual, GA4 devuelve "YYYYMM" y lo convertimos a "YYYY-MM"
    if (dateRaw.length === 6) {
      return `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}`;
    }
  }
  // Para otras granularidades, GA4 devuelve "YYYYMMDD" y lo convertimos a "YYYY-MM-DD"
  if (dateRaw.length === 8) {
    return `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(
      6,
      8
    )}`;
  }
  return dateRaw; // fallback
}

export type GA4Row = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

export type MappingResult = {
  currentSeries: number[];
  previousSeries: number[];
  totalCurrent: number;
  totalPrevious: number;
  xLabels: string[];
  previousLabels: string[];
};

/**
 * GRANULARIDAD DIARIA (d)
 * Labels: YYYY-MM-DD para cada día
 */
export function mapDailyData<T>(
  rows: GA4Row[],
  categoryMatcher: (path: string) => T | null,
  targetCategory: T,
  ranges: { current: DateRange; previous: DateRange }
): MappingResult {
  // Generar labels para current (7 días)
  const xLabels: string[] = [];
  const currentStart = new Date(ranges.current.start);
  const currentEnd = new Date(ranges.current.end);

  const current = new Date(currentStart);
  while (current <= currentEnd) {
    xLabels.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  // Generar labels para previous (7 días)
  const previousLabels: string[] = [];
  const previousStart = new Date(ranges.previous.start);
  const previousEnd = new Date(ranges.previous.end);

  const prev = new Date(previousStart);
  while (prev <= previousEnd) {
    previousLabels.push(prev.toISOString().slice(0, 10));
    prev.setDate(prev.getDate() + 1);
  }

  // Inicializar series
  const currentSeries = new Array(xLabels.length).fill(0);
  const previousSeries = new Array(previousLabels.length).fill(0);

  let totalCurrent = 0;
  let totalPrevious = 0;

  // Procesar filas
  for (const r of rows) {
    const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
    if (!dateRaw) continue;

    const iso = parseGA4Date(dateRaw, "d");
    const url = String(r.dimensionValues?.[1]?.value ?? "");
    const path = safeUrlPathname(url);
    const value = Number(r.metricValues?.[0]?.value ?? 0);

    // Verificar que la URL corresponde a nuestra categoría
    const matchedCategory = categoryMatcher(path);
    if (matchedCategory !== targetCategory) continue;

    // Mapear a current series
    if (iso >= ranges.current.start && iso <= ranges.current.end) {
      const timeIndex = xLabels.indexOf(iso);
      if (timeIndex >= 0) {
        currentSeries[timeIndex] += value;
      }
      totalCurrent += value;
    }

    // Mapear a previous series
    if (iso >= ranges.previous.start && iso <= ranges.previous.end) {
      const timeIndex = previousLabels.indexOf(iso);
      if (timeIndex >= 0) {
        previousSeries[timeIndex] += value;
      }
      totalPrevious += value;
    }
  }

  return {
    currentSeries,
    previousSeries,
    totalCurrent,
    totalPrevious,
    xLabels,
    previousLabels,
  };
}

/**
 * GRANULARIDAD SEMANAL (w)
 * Labels: UN SOLO PUNTO que representa toda la semana (agregado)
 * La etiqueta es el rango de fechas de la semana
 */
export function mapWeeklyData<T>(
  rows: GA4Row[],
  categoryMatcher: (path: string) => T | null,
  targetCategory: T,
  ranges: { current: DateRange; previous: DateRange }
): MappingResult {
  // Para weekly: UN SOLO punto por período (agregado de toda la semana)
  const xLabels = [`${ranges.current.start} to ${ranges.current.end}`];
  const previousLabels = [`${ranges.previous.start} to ${ranges.previous.end}`];

  // Inicializar series con 1 punto cada una
  const currentSeries = [0];
  const previousSeries = [0];

  let totalCurrent = 0;
  let totalPrevious = 0;

  // Procesar filas
  for (const r of rows) {
    const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
    if (!dateRaw) continue;

    const iso = parseGA4Date(dateRaw, "w");
    const url = String(r.dimensionValues?.[1]?.value ?? "");
    const path = safeUrlPathname(url);
    const value = Number(r.metricValues?.[0]?.value ?? 0);

    // Verificar que la URL corresponde a nuestra categoría
    const matchedCategory = categoryMatcher(path);
    if (matchedCategory !== targetCategory) continue;

    // Agregar a current (TODO el rango)
    if (iso >= ranges.current.start && iso <= ranges.current.end) {
      currentSeries[0] += value;
      totalCurrent += value;
    }

    // Agregar a previous (TODO el rango)
    if (iso >= ranges.previous.start && iso <= ranges.previous.end) {
      previousSeries[0] += value;
      totalPrevious += value;
    }
  }

  return {
    currentSeries,
    previousSeries,
    totalCurrent,
    totalPrevious,
    xLabels,
    previousLabels,
  };
}

/**
 * GRANULARIDAD MENSUAL (m)
 * Labels: YYYY-MM-DD para cada día (30 días)
 */
export function mapMonthlyData<T>(
  rows: GA4Row[],
  categoryMatcher: (path: string) => T | null,
  targetCategory: T,
  ranges: { current: DateRange; previous: DateRange }
): MappingResult {
  // Generar labels para current (30 días)
  const xLabels: string[] = [];
  const currentStart = new Date(ranges.current.start);
  const currentEnd = new Date(ranges.current.end);

  const current = new Date(currentStart);
  while (current <= currentEnd) {
    xLabels.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  // Generar labels para previous (30 días)
  const previousLabels: string[] = [];
  const previousStart = new Date(ranges.previous.start);
  const previousEnd = new Date(ranges.previous.end);

  const prev = new Date(previousStart);
  while (prev <= previousEnd) {
    previousLabels.push(prev.toISOString().slice(0, 10));
    prev.setDate(prev.getDate() + 1);
  }

  // Inicializar series
  const currentSeries = new Array(xLabels.length).fill(0);
  const previousSeries = new Array(previousLabels.length).fill(0);

  let totalCurrent = 0;
  let totalPrevious = 0;

  // Procesar filas
  for (const r of rows) {
    const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
    if (!dateRaw) continue;

    const iso = parseGA4Date(dateRaw, "m");
    const url = String(r.dimensionValues?.[1]?.value ?? "");
    const path = safeUrlPathname(url);
    const value = Number(r.metricValues?.[0]?.value ?? 0);

    // Verificar que la URL corresponde a nuestra categoría
    const matchedCategory = categoryMatcher(path);
    if (matchedCategory !== targetCategory) continue;

    // Mapear a current series
    if (iso >= ranges.current.start && iso <= ranges.current.end) {
      const timeIndex = xLabels.indexOf(iso);
      if (timeIndex >= 0) {
        currentSeries[timeIndex] += value;
      }
      totalCurrent += value;
    }

    // Mapear a previous series
    if (iso >= ranges.previous.start && iso <= ranges.previous.end) {
      const timeIndex = previousLabels.indexOf(iso);
      if (timeIndex >= 0) {
        previousSeries[timeIndex] += value;
      }
      totalPrevious += value;
    }
  }

  return {
    currentSeries,
    previousSeries,
    totalCurrent,
    totalPrevious,
    xLabels,
    previousLabels,
  };
}

/**
 * GRANULARIDAD ANUAL (y)
 * Labels: YYYY-MM para cada mes
 */
export function mapYearlyData<T>(
  rows: GA4Row[],
  categoryMatcher: (path: string) => T | null,
  targetCategory: T,
  ranges: { current: DateRange; previous: DateRange }
): MappingResult {
  // Generar labels para current (por meses)
  const xLabels: string[] = [];
  const currentStart = new Date(ranges.current.start);
  const currentEnd = new Date(ranges.current.end);

  const current = new Date(
    currentStart.getFullYear(),
    currentStart.getMonth(),
    1
  );
  const endDate = new Date(currentEnd);
  while (current <= endDate) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    xLabels.push(`${year}-${month}`);
    current.setMonth(current.getMonth() + 1);
  }

  // Generar labels para previous (por meses)
  const previousLabels: string[] = [];
  const previousStart = new Date(ranges.previous.start);
  const previousEnd = new Date(ranges.previous.end);

  const prev = new Date(
    previousStart.getFullYear(),
    previousStart.getMonth(),
    1
  );
  const prevEndDate = new Date(previousEnd);
  while (prev <= prevEndDate) {
    const year = prev.getFullYear();
    const month = String(prev.getMonth() + 1).padStart(2, "0");
    previousLabels.push(`${year}-${month}`);
    prev.setMonth(prev.getMonth() + 1);
  }

  // Inicializar series
  const currentSeries = new Array(xLabels.length).fill(0);
  const previousSeries = new Array(previousLabels.length).fill(0);

  let totalCurrent = 0;
  let totalPrevious = 0;

  // Procesar filas
  for (const r of rows) {
    const dateRaw = String(r.dimensionValues?.[0]?.value ?? "");
    if (!dateRaw) continue;

    const iso = parseGA4Date(dateRaw, "y");
    const url = String(r.dimensionValues?.[1]?.value ?? "");
    const path = safeUrlPathname(url);
    const value = Number(r.metricValues?.[0]?.value ?? 0);

    // Verificar que la URL corresponde a nuestra categoría
    const matchedCategory = categoryMatcher(path);
    if (matchedCategory !== targetCategory) continue;

    // Para yearly, los datos vienen como YYYY-MM
    const isoYM = iso; // Ya viene como "2025-09"

    // Mapear a current series
    const currentStartYM = ranges.current.start.slice(0, 7);
    const currentEndYM = ranges.current.end.slice(0, 7);

    if (isoYM >= currentStartYM && isoYM <= currentEndYM) {
      const timeIndex = xLabels.indexOf(isoYM);
      if (timeIndex >= 0) {
        currentSeries[timeIndex] += value;
      }
      totalCurrent += value;
    }

    // Mapear a previous series
    const previousStartYM = ranges.previous.start.slice(0, 7);
    const previousEndYM = ranges.previous.end.slice(0, 7);

    if (isoYM >= previousStartYM && isoYM <= previousEndYM) {
      const timeIndex = previousLabels.indexOf(isoYM);
      if (timeIndex >= 0) {
        previousSeries[timeIndex] += value;
      }
      totalPrevious += value;
    }
  }

  return {
    currentSeries,
    previousSeries,
    totalCurrent,
    totalPrevious,
    xLabels,
    previousLabels,
  };
}

/**
 * FUNCIÓN DISPATCHER - Elige la función correcta según granularidad
 */
export function mapDataByGranularity<T>(
  granularity: Granularity,
  rows: GA4Row[],
  categoryMatcher: (path: string) => T | null,
  targetCategory: T,
  ranges: { current: DateRange; previous: DateRange }
): MappingResult {
  switch (granularity) {
    case "d":
      return mapDailyData(rows, categoryMatcher, targetCategory, ranges);
    case "w":
      return mapWeeklyData(rows, categoryMatcher, targetCategory, ranges);
    case "m":
      return mapMonthlyData(rows, categoryMatcher, targetCategory, ranges);
    case "y":
      return mapYearlyData(rows, categoryMatcher, targetCategory, ranges);
    default:
      throw new Error(`Unsupported granularity: ${granularity}`);
  }
}

/**
 * FUNCIÓN PARA FORMATEAR SERIES CON LABELS CORRECTOS
 */
export function formatSeriesWithGranularity(result: MappingResult): {
  current: Array<{ label: string; value: number }>;
  previous: Array<{ label: string; value: number }>;
} {
  return {
    current: result.currentSeries.map((value, i) => ({
      label: result.xLabels[i],
      value,
    })),
    previous: result.previousSeries.map((value, i) => ({
      label: result.previousLabels[i] || result.xLabels[i], // fallback
      value,
    })),
  };
}
