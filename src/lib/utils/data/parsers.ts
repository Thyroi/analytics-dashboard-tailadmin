/**
 * /lib/utils/data/parsers.ts
 * Utilidades para parsear y transformar datos de GA4
 */

/**
 * Parsea fechas de GA4 según granularidad
 *
 * @param dateRaw - Fecha en formato YYYYMMDD (diario) o YYYYMM (anual)
 * @param granularity - Granularidad temporal ('y' para anual, otros para diario)
 * @returns Fecha en formato ISO (YYYY-MM-DD o YYYY-MM)
 *
 * @example
 * parseGA4Date('20251015', 'd') // '2025-10-15'
 * parseGA4Date('202510', 'y')   // '2025-10'
 */
export function parseGA4Date(dateRaw: string, granularity: string): string {
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
