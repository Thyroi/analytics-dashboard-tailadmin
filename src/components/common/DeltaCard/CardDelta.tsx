"use client";

import type { DeltaArtifact } from "@/lib/utils/delta";
import { getDeltaColor, getDeltaMainText } from "@/lib/utils/delta";

type Props = {
  deltaPct: number | null;
  loading: boolean;
  deltaArtifact?: DeltaArtifact; // Nuevo: artifact opcional
};

export default function CardDelta({ deltaPct, loading, deltaArtifact }: Props) {
  // Si tenemos artifact, usarlo; si no, fallback al sistema anterior
  const displayText = deltaArtifact
    ? getDeltaMainText(deltaArtifact)
    : deltaPct !== null && deltaPct !== undefined && Number.isFinite(deltaPct)
    ? `${deltaPct > 0 ? "+" : deltaPct < 0 ? "−" : ""}${Math.abs(
        deltaPct
      ).toLocaleString("es-ES", { maximumFractionDigits: 0 })}%`
    : "Sin datos suficientes";

  const colorClass = deltaArtifact
    ? getDeltaColor(deltaArtifact)
    : deltaPct === null
    ? "text-gray-400"
    : deltaPct >= 0
    ? "text-[#35C759]"
    : "text-[#E74C3C]";

  // Solo es "sin datos" si realmente no hay current o no hay prev Y no hay current
  // Los estados new_vs_zero, zero_vs_zero tienen datos válidos para mostrar
  const isNoData = deltaArtifact
    ? deltaArtifact.state === "no_current" ||
      (deltaArtifact.state === "no_prev" &&
        deltaArtifact.baseInfo.current === null)
    : deltaPct === null;

  // Detectar si es "Sin actividad" para usar tamaño pequeño
  const isSinActividad =
    deltaArtifact?.state === "ok" &&
    deltaArtifact.baseInfo.current === 0 &&
    deltaArtifact.baseInfo.prev !== null &&
    deltaArtifact.baseInfo.prev > 0;

  // Determinar tamaño: pequeño para "sin datos" o "sin actividad", normal para el resto
  const fontSize = isNoData || isSinActividad ? 14 : 28;
  const lineHeight = isNoData || isSinActividad ? "18px" : "28px";

  return (
    <div
      className={`self-end text-center font-extrabold ${colorClass}`}
      style={{
        fontSize,
        lineHeight,
        visibility: loading ? "hidden" : "visible",
      }}
    >
      {displayText}
    </div>
  );
}
