/**
 * Sistema robusto de cálculo y formateo de deltas
 *
 * Proporciona funciones puras para calcular deltas (absolutos y porcentuales)
 * con estados explícitos y helpers de UI consistentes.
 */

import type {
  ComputeDeltaOptions,
  DeltaArtifact,
  DeltaFlags,
  DeltaState,
  TooltipParts,
} from "./types";

/**
 * Verifica si un valor es finito y válido para cálculos
 */
function isValidNumber(value: number | null | undefined): value is number {
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
    // NUEVA LÓGICA: Asignar prev = 1 para calcular delta porcentual
    state = "new_vs_zero";
    // Calcular delta porcentual usando 1 como base
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
    baseInfo: {
      current: currValue,
      prev: prevValue,
    },
    flags,
  };
}

/**
 * Obtiene el texto principal para mostrar el delta
 *
 * @param artifact - Artefacto de delta
 * @returns Texto formateado para UI
 *
 * @example
 * ```typescript
 * getDeltaMainText({ deltaPct: 20, state: "ok", ... })
 * // → "+20.0%"
 *
 * getDeltaMainText({ deltaAbs: 42, state: "new_vs_zero", ... })
 * // → "+42"
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
        return `${sign}${abs.toFixed(1)}%`;
      }
      return "0%";

    case "new_vs_zero":
      // Mostrar delta porcentual si está disponible (calculado con base = 1)
      if (deltaPct !== null) {
        const sign = deltaPct > 0 ? "+" : deltaPct < 0 ? "−" : "";
        const abs = Math.abs(deltaPct);
        return `${sign}${abs.toFixed(1)}%`;
      }
      // Fallback: mostrar valor absoluto si no hay deltaPct
      if (deltaAbs !== null) {
        return `+${deltaAbs.toLocaleString("es-ES")}`;
      }
      if (baseInfo.current !== null) {
        return `+${baseInfo.current.toLocaleString("es-ES")}`;
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
  if (state === "new_vs_zero") return "text-green-600";
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

  return "→";
}

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
      if (deltaPct !== null && baseInfo.current !== null) {
        // Mostrar que se usó base=1 para el cálculo
        const pctSign = deltaPct >= 0 ? "+" : "";
        detail = `Base previa=0, usando base=1 para %. ${pctSign}${deltaPct.toFixed(
          1
        )}% · Δ +${baseInfo.current.toLocaleString(
          "es-ES"
        )} · de 0 → ${baseInfo.current.toLocaleString("es-ES")}`;
      } else if (baseInfo.current !== null) {
        detail = `Sin base previa (prev=0). Δ +${baseInfo.current.toLocaleString(
          "es-ES"
        )} · de 0 → ${baseInfo.current.toLocaleString("es-ES")}`;
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

/**
 * Clamp visual para porcentajes en gráficos (NO afecta tooltips ni datos)
 *
 * @param pct - Porcentaje a limitar
 * @param cap - Límite superior/inferior (default: 300)
 * @returns Porcentaje clampeado
 *
 * @example
 * ```typescript
 * clampPctForVisual(2000) // → 300
 * clampPctForVisual(-500) // → -300
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
