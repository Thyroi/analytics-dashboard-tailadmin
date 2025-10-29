/**
 * Utilidades para tokenización y normalización de strings
 * Consolidación de funciones duplicadas en el proyecto
 */

/**
 * Normaliza un string removiendo diacríticos y convirtiéndolo a minúsculas
 */
export function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Normaliza y tokeniza un string para matching robusto.
 * Genera variantes: original, kebab-case, snake_case, sin separadores
 *
 * @param base - String base a tokenizar
 * @returns Array de variantes del string
 *
 * @example
 * toTokens("Playas y Costa")
 * // ["playas y costa", "playas-y-costa", "playas_y_costa", "playasycosta"]
 */
export function toTokens(base: string): string[] {
  const normalized = normalize(base);

  // Generar variantes útiles
  const kebab = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const snake = normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const compact = normalized.replace(/[^a-z0-9]+/g, "");

  // Usar Set para evitar duplicados
  return Array.from(
    new Set([normalized, kebab, snake, compact].filter(Boolean))
  );
}
