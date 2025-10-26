/**
 * Sistema robusto de manejo de deltas
 *
 * Exporta tipos y funciones para cálculo y formateo consistente
 * de deltas (absolutos y porcentuales) con estados explícitos.
 */

export type {
  ComputeDeltaOptions,
  DeltaArtifact,
  DeltaFlags,
  DeltaState,
  TooltipParts,
} from "./types";

export {
  clampPctForVisual,
  computeDeltaArtifact,
  getDeltaColor,
  getDeltaIcon,
  getDeltaMainText,
  getDeltaTooltip,
  sortByDelta,
} from "./delta";
