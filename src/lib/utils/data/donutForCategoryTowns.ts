/**
 * /lib/utils/data/donutForCategoryTowns.ts
 * Construcción de gráficos donut para distribución de pueblos por categoría
 */

import { safeUrlPathname } from "../routing/pathMatching";
import { parseGA4Date } from "./parsers";
import type { GA4Row } from "./types";

/**
 * Construye datos para donut de pueblos en una categoría específica
 *
 * Agrupa los datos por pueblo y genera un bucket "(otros)" para URLs sin mapear.
 * Útil para visualizar qué pueblos tienen más actividad en una categoría.
 *
 * @param rows - Filas de datos de GA4
 * @param categoryMatcher - Función que extrae categoría de un path
 * @param targetCategory - Categoría objetivo
 * @param townMatcher - Función que extrae pueblo de un path
 * @param donutStart - Fecha inicio del período
 * @param donutEnd - Fecha fin del período
 * @param granularity - Granularidad temporal
 * @returns Array de { label, value } ordenado por valor descendente
 *
 * @example
 * const donut = buildTownsDonutForCategory(
 *   ga4Rows,
 *   detectCategory,
 *   'playas',
 *   detectTown,
 *   '2025-10-01',
 *   '2025-10-31',
 *   'd'
 * );
 * // [{ label: 'Almonte', value: 1500 }, { label: 'Huelva', value: 800 }, ...]
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
  let unmappedCount = 0;
  const unmappedExamples: string[] = [];

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
    } else {
      // No se pudo mapear a un pueblo - agregar a bucket "unmapped"
      unmappedCount += value;

      // Guardar ejemplos de URLs sin mapear (máximo 5 únicos)
      if (unmappedExamples.length < 5 && !unmappedExamples.includes(path)) {
        unmappedExamples.push(path);
      }
    }
  }

  const result = Object.entries(townCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // Si hay eventos sin mapear, agregar al final con ejemplos
  if (unmappedCount > 0) {
    // Extraer último segmento de las URLs de ejemplo para el label
    const pathSegments = unmappedExamples
      .map((path) => {
        const segments = path.split("/").filter((s) => s.length > 0);
        return segments[segments.length - 1] || "general";
      })
      .slice(0, 3); // Máximo 3 ejemplos en el label

    const exampleLabel =
      pathSegments.length > 0
        ? `Otros (${pathSegments.join(", ")}${
            unmappedExamples.length > 3 ? ", ..." : ""
          })`
        : "Otros (sin pueblo)";

    result.push({ label: exampleLabel, value: unmappedCount });
  }

  return result;
}
