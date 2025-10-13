import { isFiniteNumber } from "../formatting/format";

export const DELTA_COLORS = {
  pos: "#35C759",
  neg: "#902919",
  none: "#9CA3AF",
} as const;

export function coerceDelta(v: number | null | undefined): number | null {
  return isFiniteNumber(v) ? v : null;
}

/** 0–100 (valor absoluto, acotado) */
export function deltaProgress(delta: number | null): number {
  if (!isFiniteNumber(delta)) return 0;
  return Math.max(0, Math.min(100, Math.abs(delta)));
}

/** Visuales para el aro estático (cuando NO carga) */
export function ringVisuals(delta: number | null) {
  const progress = deltaProgress(delta);
  const deg = progress * 3.6;
  const ringColor =
    delta === null
      ? DELTA_COLORS.none
      : delta >= 0
      ? DELTA_COLORS.pos
      : DELTA_COLORS.neg;
  const trackColor = "rgba(0,0,0,0)";
  const ringBackground = `conic-gradient(${ringColor} 0deg ${deg}deg, ${trackColor} ${deg}deg 360deg)`;
  return { deg, ringColor, trackColor, ringBackground };
}
