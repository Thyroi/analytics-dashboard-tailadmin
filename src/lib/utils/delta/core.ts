/**
 * Funciones core de validación y cálculo de deltas
 */

import type {
  ComputeDeltaOptions,
  DeltaArtifact,
  DeltaFlags,
  DeltaState,
} from "./types";

/**
 * Verifica si un valor es finito y válido para cálculos
 */
export function isValidNumber(
  value: number | null | undefined
): value is number {
  return (
    value !== null &&
    value !== undefined &&
    Number.isFinite(value) &&
    !Number.isNaN(value)
  );
}

/**
 * Calcula el artefacto completo de delta con estado y flags
 *
 * @param current - Valor actual
 * @param prev - Valor del período anterior
 * @param opts - Opciones de cálculo
 * @returns Artefacto completo con deltaAbs, deltaPct, state, flags
 *
 * @example
 * ```typescript
 * // Caso normal: prev > 0
 * computeDeltaArtifact(120, 100)
 * // → { deltaAbs: 20, deltaPct: 20, state: "ok", ... }
 *
 * // Nuevo vs cero
 * computeDeltaArtifact(42, 0)
 * // → { deltaAbs: 42, deltaPct: null, state: "new_vs_zero", ... }
 *
 * // Base pequeña
 * computeDeltaArtifact(42, 2, { smallBaseThreshold: 10 })
 * // → { deltaAbs: 40, deltaPct: 2000, state: "ok", flags: { smallBase: true, ... }, ... }
 * ```
 */
export function computeDeltaArtifact(
  current: number | null | undefined,
  prev: number | null | undefined,
  opts: ComputeDeltaOptions = {}
): DeltaArtifact {
  const {
    smallBaseThreshold = 10,
    partialPeriod = false,
    methodChanged = false,
  } = opts;

  // Sanitizar valores
  const currValid = isValidNumber(current);
  const prevValid = isValidNumber(prev);

  const currValue = currValid ? current : null;
  const prevValue = prevValid ? prev : null;

  // Calcular delta absoluto (solo si ambos válidos)
  const deltaAbs =
    currValue !== null && prevValue !== null ? currValue - prevValue : null;

  // Determinar estado
  let state: DeltaState;
  let deltaPct: number | null = null;

  if (!currValid) {
    state = "no_current";
  } else if (!prevValid) {
    state = "no_prev";
  } else if (prevValue! < 0) {
    state = "neg_or_invalid_base";
  } else if (prevValue === 0 && currValue! === 0) {
    state = "zero_vs_zero";
  } else if (prevValue === 0 && currValue! > 0) {
    // Usar base=1 para calcular delta porcentual y poder mostrar siempre %
    state = "new_vs_zero";
    deltaPct = ((currValue! - 1) / 1) * 100;
  } else if (prevValue! > 0) {
    state = "ok";
    // Calcular delta porcentual
    deltaPct = ((currValue! - prevValue!) / prevValue!) * 100;
  } else {
    // prevValue === 0 y currValue < 0 (edge case raro)
    state = "new_vs_zero";
  }

  // Calcular flags
  const flags: DeltaFlags = {
    smallBase: prevValid && prevValue! > 0 && prevValue! < smallBaseThreshold,
    partialPeriod,
    methodChanged,
  };

  return {
    deltaAbs,
    deltaPct,
    state,
    flags,
    baseInfo: {
      prev: prevValue,
      current: currValue,
    },
  };
}
