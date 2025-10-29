/**
 * /lib/utils/data/donutForUrls.ts
 * Construcción de gráficos donut para distribución de URLs específicas
 */

import { safeUrlPathname } from "../routing/pathMatching";
import { parseGA4Date } from "./parsers";
import type { GA4Row } from "./types";

/**
 * Construye datos para donut de URLs en un pueblo y categoría específicos
 *
 * Filtra por pueblo y categoría, luego agrupa por URL completa.
 * Útil para ver qué páginas específicas son más visitadas.
 *
 * @param rows - Filas de datos de GA4
 * @param townMatcher - Función que extrae pueblo de un path
 * @param targetTown - Pueblo objetivo
 * @param categoryMatcher - Función que extrae categoría de un path
 * @param targetCategory - Categoría objetivo
 * @param donutStart - Fecha inicio del período
 * @param donutEnd - Fecha fin del período
 * @param granularity - Granularidad temporal
 * @returns Array de { label, value } con URLs ordenadas por valor
 *
 * @example
 * const donut = buildUrlsDonutForTownCategory(
 *   ga4Rows,
 *   detectTown,
 *   'almonte',
 *   detectCategory,
 *   'playas',
 *   '2025-10-01',
 *   '2025-10-31',
 *   'd'
 * );
 * // [{ label: '/almonte/playas/matalascanas', value: 500 }, ...]
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
 * Construye datos para donut de URLs en una categoría y pueblo específicos
 *
 * Similar a buildUrlsDonutForTownCategory pero con orden de parámetros diferente.
 * Filtra por categoría y pueblo, luego agrupa por URL completa.
 *
 * @param rows - Filas de datos de GA4
 * @param categoryMatcher - Función que extrae categoría de un path
 * @param targetCategory - Categoría objetivo
 * @param townMatcher - Función que extrae pueblo de un path
 * @param targetTown - Pueblo objetivo
 * @param donutStart - Fecha inicio del período
 * @param donutEnd - Fecha fin del período
 * @param granularity - Granularidad temporal
 * @returns Array de { label, value } con URLs ordenadas por valor
 *
 * @example
 * const donut = buildUrlsDonutForCategoryTown(
 *   ga4Rows,
 *   detectCategory,
 *   'playas',
 *   detectTown,
 *   'almonte',
 *   '2025-10-01',
 *   '2025-10-31',
 *   'd'
 * );
 * // [{ label: '/almonte/playas/matalascanas', value: 500 }, ...]
 */
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
