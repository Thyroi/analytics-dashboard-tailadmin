"use client";

import DateRangePicker from "@/components/common/DateRangePicker";
import type { Granularity } from "@/lib/types";
import GranularityTabs from "./GranularityTabs";

type Props = {
  mode: "granularity" | "range";
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;

  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  onClearRange: () => void;

  className?: string;
};

export default function RangeControls({
  mode,
  granularity,
  onGranularityChange,
  startDate,
  endDate,
  onRangeChange,
  onClearRange,
  className = "",
}: Props) {
  const tabsDisabled = mode === "range";

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Tabs deshabilitados en modo rango */}
      <GranularityTabs
        value={granularity}
        onChange={tabsDisabled ? () => {} : onGranularityChange}
        className={tabsDisabled ? "opacity-50 pointer-events-none" : ""}
      />

      <div className="ml-auto flex items-center gap-2">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onRangeChange={onRangeChange}
          placeholder="Selecciona un rango"
        />
        {mode === "range" && (
          <button
            onClick={onClearRange}
            className="h-11 rounded-lg px-3 text-sm font-medium border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5"
            title="Limpiar rango y volver a Día/Semana/Mes"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
