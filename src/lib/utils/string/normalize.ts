/**
 * Funciones avanzadas de normalización de strings para matching fuzzy
 * Consolidación de lógica duplicada en features/chatbot/utils/aggregation.ts
 */

/**
 * Remueve diacríticos (acentos) de un string
 */
export function removeDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Colapsa repeticiones de la misma letra
 * @example collapseRepeats("plaaya") // "playa"
 */
export function collapseRepeats(s: string): string {
  return s.replace(/([a-z0-9])\1+/gi, "$1");
}

/**
 * Normaliza un token para matching: sin diacríticos, minúsculas, sin separadores
 */
export function normalizeToken(s: string): string {
  const noDiac = removeDiacritics(s.toLowerCase());
  const compact = noDiac.replace(/[-_\s]+/g, "");
  return collapseRepeats(compact);
}

/**
 * Normaliza un string completo (versión simple)
 */
export function normalizeString(input: string): string {
  return removeDiacritics(input.toLowerCase().trim());
}

/**
 * Calcula la distancia de edición (Levenshtein) entre dos strings
 */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,     // delete
        dp[i][j - 1] + 1,     // insert
        dp[i - 1][j - 1] + cost  // substitute
      );
    }
  }
  
  return dp[m][n];
}

/**
 * Compara multiconjuntos de letras con tolerancia
 */
export function sameLettersLoose(a: string, b: string, slack: number): boolean {
  const count = (s: string): Map<string, number> => {
    const m = new Map<string, number>();
    for (const ch of s) m.set(ch, (m.get(ch) ?? 0) + 1);
    return m;
  };
  
  const ca = count(a);
  const cb = count(b);
  const allKeys = new Set([...ca.keys(), ...cb.keys()]);
  
  let diff = 0;
  for (const k of allKeys) {
    diff += Math.abs((ca.get(k) ?? 0) - (cb.get(k) ?? 0));
    if (diff > slack) return false;
  }
  
  return true;
}

/**
 * Determina si dos strings son aproximadamente iguales usando varias técnicas
 */
export function approxEquals(aRaw: string, bRaw: string): boolean {
  const a = normalizeToken(aRaw);
  const b = normalizeToken(bRaw);
  
  if (!a || !b) return false;
  if (a === b) return true;

  // Umbral según longitud
  const len = Math.max(a.length, b.length);
  const threshold = len <= 5 ? 1 : len <= 9 ? 2 : 3;

  // Distancia de edición
  if (editDistance(a, b) <= threshold) return true;

  // Igualdad por multiconjunto de letras
  if (sameLettersLoose(a, b, Math.min(2, threshold))) return true;

  // Contención (para casos como "museo" vs "museos")
  if (a.includes(b) || b.includes(a)) return true;

  return false;
}
