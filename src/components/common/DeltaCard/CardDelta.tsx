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
    ? deltaPct === 0
      ? "Sin actividad"
      : `${deltaPct > 0 ? "+" : deltaPct < 0 ? "−" : ""}${Math.abs(
          deltaPct
        ).toLocaleString("es-ES", { maximumFractionDigits: 0 })}%`
    : "Sin datos suficientes";

  const colorClass = deltaArtifact
    ? getDeltaColor(deltaArtifact)
    : deltaPct === null
    ? "text-gray-400"
    : deltaPct === 0
    ? "text-gray-400"
    : deltaPct > 0
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
    (deltaArtifact?.state === "ok" &&
      deltaArtifact.baseInfo.current === 0 &&
      deltaArtifact.baseInfo.prev !== null &&
      deltaArtifact.baseInfo.prev > 0) ||
    deltaArtifact?.state === "zero_vs_zero" ||
    (deltaArtifact?.state === "new_vs_zero" &&
      deltaArtifact.baseInfo.current === 0);

  // IMPORTANTE: deltaPct === 0 NO debe ser "sin actividad" si viene con artifact válido
  // Solo usar deltaPct === 0 cuando NO hay artifact (fallback legacy)
  const isSinActividadLegacy = !deltaArtifact && deltaPct === 0;

  // Determinar tamaño: más pequeño para "sin actividad", pequeño para "sin datos", normal para el resto
  const fontSize =
    isSinActividad || isSinActividadLegacy ? 16 : isNoData ? 14 : 28;
  const lineHeight =
    isSinActividad || isSinActividadLegacy
      ? "16px"
      : isNoData
      ? "18px"
      : "28px";

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
