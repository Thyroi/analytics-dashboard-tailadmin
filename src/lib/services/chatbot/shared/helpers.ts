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

/**
 * Normaliza texto para la API Mindsaic: lowercase, sin acentos EXCEPTO ñ
 */
export function normalizeForAPI(input: string): string {
  if (!input) return "";
  // Lowercase
  let s = input.toLowerCase();
  // Preservar ñ temporalmente
  s = s.replace(/ñ/g, "[[ENYE]]");
  // Quitar acentos
  s = s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  // Restaurar ñ
  s = s.replace(/\[\[ENYE\]\]/g, "ñ");
  // Normalizar espacios
  s = s.replace(/[ _-]+/g, " ");
  s = s.replace(/\s+/g, " ");
  s = s.trim();
  return s;
}

/**
 * Normaliza el nombre de subcategoría:
 * - trim
 * - colapsar múltiples espacios a uno solo
 * - preservar acentos
 * - lowercase para agrupación
 */
export function normalizeSubcategoryName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ") // colapsar espacios
    .toLowerCase();
}

/**
 * Suma todos los valores de una serie temporal
 */
export function sumSeries(
  series: Array<{ time: string; value: number }>
): number {
  return series.reduce((acc, p) => acc + (p.value || 0), 0);
}

/**
 * Agrupa series temporales por mes (YYYY-MM) para visualización anual
 * Usado cuando windowGranularity === 'y' para limitar a máx 12 buckets
 */
export function groupSeriesByMonth(
  series: Array<{ time: string; value: number }>
): Array<{ time: string; value: number }> {
  const monthMap = new Map<string, number>();

  for (const { time, value } of series) {
    // time en formato YYYY-MM-DD => extraer YYYY-MM
    const month = time.slice(0, 7); // "2024-03"
    monthMap.set(month, (monthMap.get(month) || 0) + (value || 0));
  }

  // Convertir a array y ordenar por time
  const result = Array.from(monthMap.entries())
    .map(([time, value]) => ({ time, value }))
    .sort((a, b) => a.time.localeCompare(b.time));

  return result;
}

/**
 * Normaliza texto para comparación de sinónimos:
 * - lowercase
 * - sin acentos (NFD + remove diacritics)
 * - sin guiones, puntos, underscores
 * - sin espacios
 * - trim
 *
 * Usado en buildCategorySynonymIndex y buildTownSynonymIndex
 */
export function normalizeForSynonymMatching(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar diacríticos
    .replace(/[._-]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Construye índice de sinónimos genérico para mapear tokens normalizados a IDs
 *
 * @param idList - Lista ordenada de IDs (e.g., CATEGORY_ID_ORDER, TOWN_ID_ORDER)
 * @param metaMap - Mapa de metadata con label (e.g., CATEGORY_META, TOWN_META)
 * @param synonymsMap - Mapa de sinónimos (e.g., CATEGORY_SYNONYMS, TOWN_SYNONYMS)
 * @returns Map de token normalizado → ID
 */
export function buildSynonymIndex<T extends string>(
  idList: readonly T[],
  metaMap: Record<T, { label: string }>,
  synonymsMap: Record<T, string[]>
): Map<string, T> {
  const index = new Map<string, T>();

  for (const id of idList) {
    // Agregar el ID mismo
    index.set(normalizeForSynonymMatching(id), id);

    // Agregar label oficial
    index.set(normalizeForSynonymMatching(metaMap[id].label), id);

    // Agregar sinónimos
    const syns = synonymsMap[id] || [];
    for (const syn of syns) {
      index.set(normalizeForSynonymMatching(syn), id);
    }
  }

  return index;
}

/**
 * Calcula delta absoluta y porcentual para totales
 *
 * @returns { deltaAbs, deltaPercent }
 */
export function calculateDeltas(
  currentTotal: number,
  prevTotal: number
): { deltaAbs: number; deltaPercent: number | null } {
  const deltaAbs = currentTotal - prevTotal;
  const deltaPercent = computeDeltaPercent(currentTotal, prevTotal);
  return { deltaAbs, deltaPercent };
}
