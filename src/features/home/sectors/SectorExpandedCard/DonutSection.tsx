import DonutLeader from "@/components/charts/DonutLeader";
import type { DonutDatum } from "@/lib/types";
import type { DeltaArtifact } from "@/lib/utils/delta";
import { getDeltaColor, getDeltaMainText } from "@/lib/utils/delta";

type DonutSectionProps = {
  donutData: DonutDatum[];
  deltaPct: number;
  deltaArtifact?: DeltaArtifact; // Nuevo: artifact opcional
};

export default function DonutSection({
  donutData,
  deltaPct,
  deltaArtifact,
}: DonutSectionProps) {
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
    : deltaPct >= 0
    ? "text-[#35C759]"
    : "text-[#E64C3C]";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-gray-900/50 p-3">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Subcategorías
      </div>
      <DonutLeader
        data={donutData}
        height={280}
        className="w-full"
        padViewBox={20}
      />
      <div
        className={`mt-3 text-center text-[28px] font-extrabold ${colorClass}`}
      >
        {displayText}
      </div>
    </div>
  );
}
