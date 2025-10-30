/**
 * src/lib/utils/delta/delta.ts
 * Librería completa para manejo de deltas comparativos (current vs prev)
 *
 * CONCEPTO:
 * Provee funciones para calcular, formatear y visualizar deltas entre
 * dos valores numéricos (ej. un KPI actual vs período previo),
 * manejando correctamente casos especiales como base=0, datos faltantes, etc.
 *
 * USO RECOMENDADO:
 * - computeDeltaArtifact(current, prev) => genera todo el artifact de delta
 * - getDeltaMainText(artifact) => texto para mostrar en UI
 * - getDeltaColor(artifact) => clase Tailwind para colorear
 * - getDeltaIcon(artifact) => icono visual (↗,↘,→)
 * - getDeltaTooltip(artifact) => información extendida en tooltip
 * - clampPctForVisual(pct) => clamp porcentaje para gráficas
 * - sortByDelta(items) => ordenar arrays por delta
 *
 * CARACTERÍSTICAS:
 * - Todos los estados (ok, new_vs_zero, zero_vs_zero, neg_or_invalid_base, no_current, no_prev) manejados
 * - Flags (smallBase, partialPeriod, methodChanged) opcionales
 * - Español-friendly: textos & formatos
 *
 * ARQUITECTURA (Refactorizado Fase 2):
 * Este archivo re-exporta funciones desde módulos especializados:
 * - core.ts: Validación y cómputo de deltas
 * - formatting.ts: Generación de texto para UI
 * - visual.ts: Colores e iconos
 * - tooltip.ts: Generación de tooltips informativos
 * - utilities.ts: Funciones auxiliares (clamp, sort)
 *
 * Mantiene 100% de compatibilidad hacia atrás.
 */

// ─────────────────────────────────────────────────────────────────────────────
// RE-EXPORTS (Módulos especializados)
// ─────────────────────────────────────────────────────────────────────────────

// Tipos
export type {
  ComputeDeltaOptions,
  DeltaArtifact,
  DeltaFlags,
  DeltaState,
  TooltipParts,
} from "./types";

// Core: Cómputo y validación
export { computeDeltaArtifact } from "./core";

// Formateo: Texto principal
export { getDeltaMainText } from "./formatting";

// Visual: Colores e iconos
export { getDeltaColor, getDeltaIcon } from "./visual";

// Tooltip: Información detallada
export { getDeltaTooltip } from "./tooltip";

// Utilidades: Clamp y ordenamiento
export { clampPctForVisual, sortByDelta } from "./utilities";
