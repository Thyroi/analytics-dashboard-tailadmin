import type { Granularity } from "@/lib/types";
import { addDaysUTC, parseISO, toISO } from "./datetime";

/**
 * Genera array de labels ISO para un rango según granularidad
 * - d: 1 día (YYYY-MM-DD)
 * - w: 7 días (YYYY-MM-DD)
 * - m: 30 días (YYYY-MM-DD)
 * - y: 12 meses (YYYY-MM)
 */
export function generateLabelsForRange(
  startISO: string,
  endISO: string,
  granularity: Granularity
): string[] {
  const labels: string[] = [];
  const start = parseISO(startISO);
  const end = parseISO(endISO);

  if (granularity === "y") {
    // Mensual: YYYY-MM
    let current = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)
    );

    while (current <= end) {
      const year = current.getUTCFullYear();
      const month = String(current.getUTCMonth() + 1).padStart(2, "0");
      labels.push(`${year}-${month}`);
      current = new Date(Date.UTC(year, current.getUTCMonth() + 1, 1));
    }
  } else {
    // Diario: YYYY-MM-DD
    let current = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
    );

    while (current <= end) {
      labels.push(toISO(current));
      current = addDaysUTC(current, 1);
    }
  }

  return labels;
}

/**
 * Calcula rango anterior del mismo tamaño (ventana contigua)
 * Ejemplo: current {2025-10-20, 2025-10-25} (6 días)
 *          → previous {2025-10-14, 2025-10-19} (6 días)
 */
export function calculatePreviousRangeForAxis(current: {
  start: string;
  end: string;
}): { start: string; end: string } {
  const startDate = parseISO(current.start);
  const endDate = parseISO(current.end);

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const duration = diffDays + 1; // inclusivo

  const prevEnd = addDaysUTC(startDate, -1);
  const prevStart = addDaysUTC(prevEnd, -(duration - 1));

  return {
    start: toISO(prevStart),
    end: toISO(prevEnd),
  };
}
