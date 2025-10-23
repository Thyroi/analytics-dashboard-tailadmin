/**
 * Utilidades para asignación determinista de colores por path
 * Evita colisiones y garantiza buena legibilidad en dark/light mode
 */

// Paleta de colores optimizada para máximo contraste visual en charts
// Cada color está estratégicamente espaciado en el espectro para máxima diferenciación
const CHART_COLORS = [
  "#E55338", // Huelva primary (Rojo-Naranja)
  "#1E40AF", // Blue 800 (Azul profundo)
  "#059669", // Emerald 600 (Verde)
  "#7C2D12", // Orange 900 (Marrón)
  "#6B21A8", // Purple 800 (Morado)
  "#0F766E", // Teal 700 (Verde azulado)
  "#BE185D", // Pink 700 (Rosa)
  "#365314", // Green 900 (Verde oliva)
] as const;

// Paleta extendida para más de 8 elementos (colores secundarios con buen contraste)
const EXTENDED_CHART_COLORS = [
  ...CHART_COLORS,
  "#DC2626", // Red 600
  "#2563EB", // Blue 600
  "#16A34A", // Green 600
  "#EA580C", // Orange 600
  "#9333EA", // Violet 600
  "#0891B2", // Cyan 600
  "#E11D48", // Rose 600
  "#65A30D", // Lime 600
] as const;

/**
 * Hash function simple (djb2) para strings
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Obtiene un color determinista para un path dado
 * @param path - El path de la página (ej: "/category/page-x")
 * @returns Color hex string
 */
export function colorForPath(path: string): string {
  const hash = hashString(path);
  const index = hash % CHART_COLORS.length;
  return CHART_COLORS[index];
}

/**
 * Obtiene múltiples colores para una lista de paths
 * @param paths - Array de paths
 * @returns Record con path como key y color como value
 */
export function colorsForPaths(paths: string[]): Record<string, string> {
  return paths.reduce((acc, path) => {
    acc[path] = colorForPath(path);
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Asigna colores secuencialmente para máximo contraste visual
 * Esta función garantiza que los colores estén lo más diferenciados posible
 * @param paths - Array de paths ordenados por prioridad
 * @returns Record con path como key y color como value
 */
export function getContrastingColors(paths: string[]): Record<string, string> {
  // First, get unique paths while preserving order of first appearance
  const uniquePaths = Array.from(new Set(paths));
  const colorsToUse =
    uniquePaths.length <= 8 ? CHART_COLORS : EXTENDED_CHART_COLORS;

  return uniquePaths.reduce((acc, path, index) => {
    acc[path] = colorsToUse[index % colorsToUse.length];
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Paleta de colores disponibles (para referencia)
 */
export const AVAILABLE_COLORS = CHART_COLORS;

/**
 * Paleta extendida de colores disponibles (para referencia)
 */
export const AVAILABLE_EXTENDED_COLORS = EXTENDED_CHART_COLORS;
