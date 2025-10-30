/**
 * Formateo visual (colores e iconos) para deltas
 */

import type { DeltaArtifact } from "./types";

/**
 * Obtiene el color para el delta según su valor y estado
 *
 * @param artifact - Artefacto de delta
 * @returns Clase de Tailwind CSS para color
 *
 * @example
 * ```typescript
 * getDeltaColor({ deltaPct: 20, state: "ok", ... })
 * // → "text-green-600"
 *
 * getDeltaColor({ deltaPct: -10, state: "ok", ... })
 * // → "text-red-600"
 * ```
 */
export function getDeltaColor(artifact: DeltaArtifact): string {
  const { deltaPct, deltaAbs, state, baseInfo } = artifact;

  // Caso especial: current = 0 y prev > 0 (cayó a cero) → gris neutral
  if (
    state === "ok" &&
    baseInfo.current === 0 &&
    baseInfo.prev !== null &&
    baseInfo.prev > 0
  ) {
    return "text-gray-500";
  }

  // Si hay delta porcentual válido, usar ese
  if (deltaPct !== null) {
    if (deltaPct > 0) return "text-green-600";
    if (deltaPct < 0) return "text-red-600";
    return "text-gray-500";
  }

  // Si no hay %, usar delta absoluto
  if (deltaAbs !== null) {
    if (deltaAbs > 0) return "text-green-600";
    if (deltaAbs < 0) return "text-red-600";
    return "text-gray-500";
  }

  // Sin datos o estados especiales
  if (state === "new_vs_zero") {
    // Si current = 0, es "Sin actividad" (gris)
    if (baseInfo.current === 0) return "text-gray-500";
    // Si current > 0, es nuevo dato (verde)
    return "text-green-600";
  }
  if (state === "zero_vs_zero") return "text-gray-500";

  return "text-gray-500";
}

/**
 * Obtiene el icono (flecha) para el delta
 *
 * @param artifact - Artefacto de delta
 * @returns Carácter de flecha
 *
 * @example
 * ```typescript
 * getDeltaIcon({ deltaPct: 20, ... }) // → "↗"
 * getDeltaIcon({ deltaPct: -10, ... }) // → "↘"
 * getDeltaIcon({ deltaPct: 0, ... }) // → "→"
 * ```
 */
export function getDeltaIcon(artifact: DeltaArtifact): string {
  const { deltaPct, deltaAbs, state, baseInfo } = artifact;

  // Caso especial: current = 0 y prev > 0 (cayó a cero) → flecha neutral
  if (
    state === "ok" &&
    baseInfo.current === 0 &&
    baseInfo.prev !== null &&
    baseInfo.prev > 0
  ) {
    return "→";
  }

  // Priorizar delta porcentual
  if (deltaPct !== null) {
    if (deltaPct > 0) return "↗";
    if (deltaPct < 0) return "↘";
    return "→";
  }

  // Usar delta absoluto
  if (deltaAbs !== null) {
    if (deltaAbs > 0) return "↗";
    if (deltaAbs < 0) return "↘";
    return "→";
  }

  // Estados especiales
  if (state === "new_vs_zero") {
    // Si current = 0, flecha neutral
    if (baseInfo.current === 0) return "→";
    // Si current > 0, flecha arriba
    return "↗";
  }

  return "→";
}
