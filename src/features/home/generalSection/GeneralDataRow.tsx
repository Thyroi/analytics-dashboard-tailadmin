"use client";

import GeneralDataCard from "@/features/home/generalSection/GeneralDataCard";
import type { Granularity } from "@/lib/types";

type Props = {
  mode: "granularity" | "range";
  granularity: Granularity;
  startDate: Date;
  endDate: Date;
  onGranularityChange: (g: Granularity) => void;
  onRangeChange: (start: Date, end: Date) => void;
  onClearRange: () => void;
  className?: string;
};

export default function GeneralDataRow({
  mode,
  granularity,
  startDate,
  endDate,
  onGranularityChange,
  onRangeChange,
  onClearRange,
  className = "",
}: Props) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch ${className}`}
    >
      <div className="w-full h-full">
        <GeneralDataCard
          title="Usuarios totales"
          metric="visits"
          mode={mode}
          granularity={granularity}
          startDate={startDate}
          endDate={endDate}
          onGranularityChange={onGranularityChange}
          onRangeChange={onRangeChange}
          onClearRange={onClearRange}
          className="w-full h-full"
        />
      </div>
      <div className="w-full h-full">
        <GeneralDataCard
          title="Interacciones totales"
          metric="interactions"
          mode={mode}
          granularity={granularity}
          startDate={startDate}
          endDate={endDate}
          onGranularityChange={onGranularityChange}
          onRangeChange={onRangeChange}
          onClearRange={onClearRange}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
