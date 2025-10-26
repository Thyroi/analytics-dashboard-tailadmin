/**
 * Sistema de tipos para manejo robusto de deltas
 *
 * Contrato estándar para cálculo y render de deltas (absolutos y porcentuales)
 * con estados explícitos y flags de contexto.
 */

/**
 * Estados posibles del cálculo de delta
 *
 * - `ok`: Ambos valores presentes y prev > 0 → se puede calcular %
 * - `new_vs_zero`: current > 0 y prev = 0 → nuevo vs nada
 * - `zero_vs_zero`: current = 0 y prev = 0 → sin cambio
 * - `neg_or_invalid_base`: prev < 0 o no finito → base inválida
 * - `no_current`: current faltante/inválido
 * - `no_prev`: prev faltante/inválido
 */
export type DeltaState =
  | "ok"
  | "new_vs_zero"
  | "zero_vs_zero"
  | "neg_or_invalid_base"
  | "no_current"
  | "no_prev";

/**
 * Flags de contexto que afectan la interpretación del delta
 */
export interface DeltaFlags {
  /** Base pequeña: prev > 0 pero < threshold (default: 10) */
  smallBase: boolean;
  /** Período parcial: datos incompletos por rango de fechas */
  partialPeriod: boolean;
  /** Metodología cambió: comparación puede no ser directa */
  methodChanged: boolean;
}

/**
 * Artefacto completo del cálculo de delta
 *
 * Contiene toda la información necesaria para render consistente
 * sin lógica duplicada en componentes.
 */
export interface DeltaArtifact {
  /** Delta absoluto: current - prev (null si alguno no finito) */
  deltaAbs: number | null;

  /** Delta porcentual: ((current - prev)/prev)*100 (null si prev <= 0) */
  deltaPct: number | null;

  /** Estado del cálculo */
  state: DeltaState;

  /** Valores base para referencia */
  baseInfo: {
    current: number | null;
    prev: number | null;
  };

  /** Flags de contexto */
  flags: DeltaFlags;
}

/**
 * Opciones para cálculo de delta
 */
export interface ComputeDeltaOptions {
  /** Threshold para flag smallBase (default: 10) */
  smallBaseThreshold?: number;

  /** Marcar si el período es parcial/incompleto */
  partialPeriod?: boolean;

  /** Marcar si hubo cambio de metodología */
  methodChanged?: boolean;
}

/**
 * Partes del tooltip para render
 */
export interface TooltipParts {
  /** Título breve del estado */
  title: string;

  /** Detalle con valores y fórmula */
  detail: string;

  /** Chips/badges de advertencia o contexto */
  chips: string[];
}
