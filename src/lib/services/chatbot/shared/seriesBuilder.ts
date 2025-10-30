/**
 * Construcción de series temporales a partir de datos agregados
 */

import type { SeriesPoint, WindowGranularity } from "@/lib/types";
import { addDaysUTC, parseISO, toISO } from "@/lib/utils/time/datetime";

/**
 * Construye una serie temporal a partir de totales diarios
 *
 * Para granularidad "y": Agrupa por mes (YYYY-MM) con 12 buckets
 * Para otras granularidades: Un punto por día (YYYY-MM-DD)
 */
export function buildSeriesForRange(
  totalsByISO: Map<string, number>,
  startISO: string,
  endISO: string,
  windowGranularity: WindowGranularity = "d"
): SeriesPoint[] {
  const start = parseISO(startISO);
  const end = parseISO(endISO);

  // Para granularidad anual: Agrupar por mes
  if (windowGranularity === "y") {
    const monthlyTotals = new Map<string, number>();

    // Iterar todos los días y agrupar por mes
    for (
      let d = new Date(start.getTime());
      d.getTime() <= end.getTime();
      d = addDaysUTC(d, 1)
    ) {
      const iso = toISO(d);
      const monthKey = iso.substring(0, 7); // YYYY-MM
      const dayValue = totalsByISO.get(iso) || 0;

      monthlyTotals.set(
        monthKey,
        (monthlyTotals.get(monthKey) || 0) + dayValue
      );
    }

    // Convertir a array y ordenar
    const months: SeriesPoint[] = Array.from(monthlyTotals.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }));

    return months;
  }

  // Para otras granularidades: Un punto por día
  const days: SeriesPoint[] = [];
  for (
    let d = new Date(start.getTime());
    d.getTime() <= end.getTime();
    d = addDaysUTC(d, 1)
  ) {
    const iso = toISO(d);
    days.push({ label: iso, value: totalsByISO.get(iso) || 0 });
  }

  return days;
}
