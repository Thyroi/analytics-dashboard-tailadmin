import DonutLeader from "@/components/charts/DonutLeader";
import type { DonutDatum } from "@/lib/types";
import { formatPct } from "./utils";

type DonutSectionProps = {
  donutData: DonutDatum[];
  deltaPct: number;
};

export default function DonutSection({
  donutData,
  deltaPct,
}: DonutSectionProps) {
  const isUp = deltaPct >= 0;

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
        className={`mt-3 text-center text-[28px] font-extrabold ${
          isUp ? "text-[#35C759]" : "text-[#E64C3C]"
        }`}
      >
        {formatPct(deltaPct)}
      </div>
    </div>
  );
}
