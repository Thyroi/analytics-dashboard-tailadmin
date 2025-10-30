/**
 * Formateo de texto para deltas
 */

import type { DeltaArtifact } from "./types";

/**
 * Obtiene el texto principal del delta formateado
 *
 * @param artifact - Artefacto de delta
 * @returns Texto formateado del delta
 *
 * @example
 * ```typescript
 * getDeltaMainText({ deltaPct: 20, state: "ok", ... })
 * // → "+20,0%"
 *
 * getDeltaMainText({ state: "no_current", ... })
 * // → "Sin dato actual"
 * ```
 */
export function getDeltaMainText(artifact: DeltaArtifact): string {
  const { state, deltaPct, deltaAbs, baseInfo } = artifact;

  switch (state) {
    case "ok":
      // Caso especial: current = 0 y prev > 0 (cayó a cero)
      if (
        baseInfo.current === 0 &&
        baseInfo.prev !== null &&
        baseInfo.prev > 0
      ) {
        return "Sin actividad";
      }

      if (deltaPct !== null) {
        const sign = deltaPct > 0 ? "+" : deltaPct < 0 ? "−" : "";
        const abs = Math.abs(deltaPct);
        // Formato español: separador de miles punto (.), separador decimal coma (,)
        const formatted = abs.toLocaleString("es-ES", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
        return `${sign}${formatted}%`;
      }
      return "0,0%";

    case "new_vs_zero":
      // Mostrar delta porcentual si está disponible (calculado con base = 1)
      if (deltaPct !== null) {
        const sign = deltaPct > 0 ? "+" : deltaPct < 0 ? "−" : "";
        const abs = Math.abs(deltaPct);
        const formatted = abs.toLocaleString("es-ES", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
        return `${sign}${formatted}%`;
      }
      if (baseInfo.current === 0) {
        return "Sin actividad";
      }
      return "Nuevo";

    case "zero_vs_zero":
      return "Sin actividad";

    case "neg_or_invalid_base":
      if (deltaAbs !== null) {
        const sign = deltaAbs >= 0 ? "±" : "";
        return `${sign}Δ${deltaAbs.toLocaleString("es-ES")}`;
      }
      return "Base inválida";

    case "no_current":
      return "Sin dato actual";

    case "no_prev":
      if (deltaAbs !== null) {
        const sign = deltaAbs >= 0 ? "+" : "";
        return `${sign}${deltaAbs.toLocaleString("es-ES")}`;
      }
      return "Sin datos";

    default:
      return "Sin datos";
  }
}
