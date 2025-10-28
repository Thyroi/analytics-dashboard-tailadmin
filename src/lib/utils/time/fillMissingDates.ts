/**
 * Rellena fechas faltantes en una serie con valores 0
 * para que el gráfico muestre el rango completo.
 *
 * Para granularidad "y", agrupa por mes (YYYY-MM) con máximo 12 buckets.
 */

export type Granularity = "d" | "w" | "m" | "y";

export interface SeriesPoint {
  label: string; // Formato ISO: "YYYY-MM-DD" (o "YYYY-MM" para yearly)
  value: number;
}

function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day || 1);
}

function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Rellena una serie con fechas faltantes según granularidad.
 *
 * COMPORTAMIENTO POR GRANULARIDAD:
 * - "d": Días individuales (YYYY-MM-DD)
 * - "w": Días individuales de la semana (7 días)
 * - "m": Días individuales del mes (hasta 31 días)
 * - "y": Meses (YYYY-MM, máximo 12 buckets)
 *
 * @param series - Serie original con posibles gaps (formato YYYY-MM-DD)
 * @param granularity - Granularidad ("d", "w", "m", "y")
 * @param startDate - Fecha de inicio del rango (ISO: "YYYY-MM-DD")
 * @param endDate - Fecha de fin del rango (ISO: "YYYY-MM-DD")
 * @returns Serie completa con fechas faltantes en 0
 */
export function fillMissingDates(
  series: SeriesPoint[],
  granularity: Granularity,
  startDate: string,
  endDate: string
): SeriesPoint[] {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);

  // Para granularidad YEAR: agrupar por mes (YYYY-MM)
  if (granularity === "y") {
    // Agrupar datos existentes por mes
    const monthMap = new Map<string, number>();
    for (const point of series) {
      const date = parseISODate(point.label);
      const monthKey = formatYearMonth(date);
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + point.value);
    }

    // Generar rango completo de meses
    const filled: SeriesPoint[] = [];
    let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (currentDate <= endMonth) {
      const monthKey = formatYearMonth(currentDate);
      const value = monthMap.get(monthKey) ?? 0;
      filled.push({ label: monthKey, value });
      currentDate = addMonths(currentDate, 1);
    }

    return filled;
  }

  // Para d, w, m: SIEMPRE usar días individuales
  // La diferencia es el RANGO, no el incremento
  const valueMap = new Map<string, number>();
  for (const point of series) {
    valueMap.set(point.label, point.value);
  }

  const filled: SeriesPoint[] = [];
  let currentDate = start;

  while (currentDate <= end) {
    const label = formatISODate(currentDate);
    const value = valueMap.get(label) ?? 0;
    filled.push({ label, value });
    currentDate = addDays(currentDate, 1); // SIEMPRE incrementar de 1 en 1 día
  }

  return filled;
}
