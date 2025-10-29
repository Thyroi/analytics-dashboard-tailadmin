/**
 * /lib/utils/data/donutForTownCategories.ts
 * Construcción de gráficos donut para distribución de categorías por pueblo
 */

import { safeUrlPathname } from "../routing/pathMatching";
import { parseGA4Date } from "./parsers";
import type { GA4Row } from "./types";

/**
 * Construye datos para donut de categorías en un pueblo específico
 *
 * Agrupa los datos por categoría y genera un bucket "(otros)" para URLs sin categorizar.
 * Útil para visualizar qué categorías son más populares en un pueblo.
 *
 * @param rows - Filas de datos de GA4
 * @param townMatcher - Función que extrae pueblo de un path
 * @param targetTown - Pueblo objetivo
 * @param categoryMatcher - Función que extrae categoría de un path
 * @param donutStart - Fecha inicio del período
 * @param donutEnd - Fecha fin del período
 * @param granularity - Granularidad temporal
 * @returns Array de { label, value } ordenado por valor descendente
 *
 * @example
 * const donut = buildCategoriesDonutForTown(
 *   ga4Rows,
 *   detectTown,
 *   'almonte',
 *   detectCategory,
 *   '2025-10-01',
 *   '2025-10-31',
 *   'd'
 * );
 * // [{ label: 'Playas', value: 2000 }, { label: 'Naturaleza', value: 1200 }, ...]
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
  const uncategorizedPaths: string[] = []; // Para guardar ejemplos de URLs sin categoría

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
    } else {
      // Guardar ejemplos de paths sin categoría
      if (uncategorizedPaths.length < 5 && !uncategorizedPaths.includes(path)) {
        uncategorizedPaths.push(path);
      }
      categoryCounts["__UNCATEGORIZED__"] =
        (categoryCounts["__UNCATEGORIZED__"] || 0) + value;
    }
  }

  // Construir resultado con label descriptivo para "Otros"
  const result = Object.entries(categoryCounts)
    .map(([label, value]) => {
      if (label === "__UNCATEGORIZED__") {
        // Extraer últimos segmentos de las URLs para el label
        const pathSegments = uncategorizedPaths
          .map((path) => {
            const segments = path.split("/").filter((s) => s.length > 0);
            return segments[segments.length - 1] || "home";
          })
          .slice(0, 3); // Máximo 3 ejemplos

        const exampleLabel =
          pathSegments.length > 0
            ? `Otros (${pathSegments.join(", ")}${
                uncategorizedPaths.length > 3 ? ", ..." : ""
              })`
            : "Otros (sin categoría)";

        return { label: exampleLabel, value };
      }
      return { label, value };
    })
    .sort((a, b) => b.value - a.value);

  return result;
}
