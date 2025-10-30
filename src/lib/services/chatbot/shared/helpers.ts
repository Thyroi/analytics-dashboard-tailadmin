/**
 * Helpers compartidos para servicios de chatbot breakdown
 */

/**
 * Convierte formato YYYY-MM-DD a YYYYMMDD requerido por Mindsaic
 */
export function formatDateForMindsaic(dateISO: string): string {
  return dateISO.replace(/-/g, "");
}

/**
 * Calcula deltaPercent según reglas:
 * - null si prev <= 0 o falta dato
 * - ((current - prev) / prev) * 100 en otro caso
 */
export function computeDeltaPercent(
  current: number,
  prev: number
): number | null {
  if (prev <= 0) return null;
  return ((current - prev) / prev) * 100;
}
