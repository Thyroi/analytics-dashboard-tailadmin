/**
 * /lib/utils/data/timeAxis.ts
 * Generación de ejes temporales para gráficos
 */

import type { Granularity } from "@/lib/types";

/**
 * Genera el eje temporal (xLabels) según la granularidad
 *
 * @param granularity - Granularidad temporal ('y', 'm', 'w', 'd')
 * @param currentStart - Fecha inicio del rango (ISO format)
 * @param currentEnd - Fecha fin del rango (ISO format)
 * @returns Array de etiquetas temporales
 *
 * @example
 * // Granularidad anual (mensual)
 * generateTimeAxis('y', '2024-10-01', '2025-10-31')
 * // ['2024-10', '2024-11', ..., '2025-10']
 *
 * // Granularidad diaria
 * generateTimeAxis('d', '2025-10-01', '2025-10-07')
 * // ['2025-10-01', '2025-10-02', ..., '2025-10-07']
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
