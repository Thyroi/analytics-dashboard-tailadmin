/**
 * Funciones utilitarias para deltas
 */

import type { DeltaArtifact } from "./types";

/**
 * Clamp delta porcentual para representación visual consistente
 *
 * Evita que porcentajes extremos (ej. +10000%) distorsionen gráficos.
 * Por defecto, limita a ±300%.
 *
 * @param pct - Porcentaje a limitar
 * @param cap - Límite máximo (default: 300)
 * @returns Porcentaje limitado a [-cap, cap]
 *
 * @example
 * ```typescript
 * clampPctForVisual(500) // → 300
 * clampPctForVisual(-1000) // → -300
 * clampPctForVisual(50) // → 50
 * ```
 */
export function clampPctForVisual(pct: number, cap = 300): number {
  return Math.max(-cap, Math.min(cap, pct));
}

/**
 * Ordena items por delta (porcentual preferido, absoluto como fallback)
 *
 * @param artifacts - Array de artefactos con IDs
 * @param direction - Dirección del sort ("asc" | "desc")
 * @returns Array ordenado
 *
 * @example
 * ```typescript
 * sortByDelta([
 *   { id: "a", artifact: { deltaPct: 20, ... } },
 *   { id: "b", artifact: { deltaPct: null, deltaAbs: 50, ... } },
 *   { id: "c", artifact: { deltaPct: -10, ... } }
 * ], "desc")
 * // → [ b (Δ50), a (+20%), c (-10%) ]
 * ```
 */
export function sortByDelta<T extends { artifact: DeltaArtifact }>(
  items: T[],
  direction: "asc" | "desc" = "desc"
): T[] {
  const sorted = [...items].sort((a, b) => {
    const aArt = a.artifact;
    const bArt = b.artifact;

    // Priorizar delta porcentual
    const aValue = aArt.deltaPct ?? aArt.deltaAbs ?? aArt.baseInfo.current ?? 0;
    const bValue = bArt.deltaPct ?? bArt.deltaAbs ?? bArt.baseInfo.current ?? 0;

    return direction === "desc" ? bValue - aValue : aValue - bValue;
  });

  return sorted;
}
