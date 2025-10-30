/**
 * Generación de tooltips informativos para deltas
 */

import type { DeltaArtifact, TooltipParts } from "./types";

/**
 * Genera las partes del tooltip para mostrar contexto completo
 *
 * @param artifact - Artefacto de delta
 * @returns Partes del tooltip (título, detalle, chips)
 *
 * @example
 * ```typescript
 * getDeltaTooltip({ deltaPct: 20, deltaAbs: 20, state: "ok", baseInfo: { current: 120, prev: 100 }, flags: { smallBase: false, ... } })
 * // → {
 * //   title: "Cambio porcentual",
 * //   detail: "Real: +20.0% · Δ +20 · de 100 → 120",
 * //   chips: []
 * // }
 * ```
 */
export function getDeltaTooltip(artifact: DeltaArtifact): TooltipParts {
  const { state, deltaPct, deltaAbs, baseInfo, flags } = artifact;

  let title = "";
  let detail = "";
  const chips: string[] = [];

  // Construir título y detalle según estado
  switch (state) {
    case "ok":
      // Caso especial: cayó a cero
      if (
        baseInfo.current === 0 &&
        baseInfo.prev !== null &&
        baseInfo.prev > 0
      ) {
        title = "Sin actividad actual";
        detail = `Actividad cayó a cero. de ${baseInfo.prev.toLocaleString(
          "es-ES"
        )} → 0`;
        break;
      }

      title = "Cambio porcentual";
      if (deltaPct !== null && deltaAbs !== null) {
        const pctSign = deltaPct >= 0 ? "+" : "";
        const absSign = deltaAbs >= 0 ? "+" : "";
        detail = `Real: ${pctSign}${deltaPct.toFixed(
          1
        )}% · Δ ${absSign}${deltaAbs.toLocaleString(
          "es-ES"
        )} · de ${baseInfo.prev?.toLocaleString(
          "es-ES"
        )} → ${baseInfo.current?.toLocaleString("es-ES")}`;
      }
      break;

    case "new_vs_zero":
      title = "Nuevo vs base cero";
      if (baseInfo.current !== null && baseInfo.current > 0) {
        // NORMALIZADO: Solo mostrar valor absoluto, sin porcentaje
        detail = `Sin base previa (prev=0). Δ +${baseInfo.current.toLocaleString(
          "es-ES"
        )} · de 0 → ${baseInfo.current.toLocaleString("es-ES")}`;
      } else if (baseInfo.current === 0) {
        detail = "de 0 → 0";
      } else {
        detail = "Sin base previa disponible";
      }
      break;

    case "zero_vs_zero":
      title = "Sin cambio";
      detail = "de 0 → 0";
      break;

    case "neg_or_invalid_base":
      title = "Base inválida";
      if (deltaAbs !== null) {
        const sign = deltaAbs >= 0 ? "+" : "";
        detail = `Base ≤ 0: % no calculable. Δ ${sign}${deltaAbs.toLocaleString(
          "es-ES"
        )} · de ${baseInfo.prev?.toLocaleString("es-ES") ?? "?"} → ${
          baseInfo.current?.toLocaleString("es-ES") ?? "?"
        }`;
      } else {
        detail = "Valor base inválido o negativo";
      }
      break;

    case "no_current":
      title = "Sin dato actual";
      detail = "El valor actual no está disponible";
      break;

    case "no_prev":
      title = "Sin base previa";
      if (baseInfo.current !== null) {
        detail = `Valor actual: ${baseInfo.current.toLocaleString(
          "es-ES"
        )} (sin referencia previa)`;
      } else {
        detail = "No hay datos del período anterior";
      }
      break;
  }

  // Agregar chips según flags
  if (flags.smallBase) {
    chips.push("Base pequeña");
  }
  if (flags.partialPeriod) {
    chips.push("Período parcial");
  }
  if (flags.methodChanged) {
    chips.push("Metodología cambiada");
  }

  return { title, detail, chips };
}
