"use client";

import LineChart from "@/components/charts/LineChart";
import RangeControls from "@/components/dashboard/RangeControls";
import type { KPISeries } from "@/hooks/useTags";
import type { Granularity } from "@/lib/chatbot/tags";
import { useMemo } from "react";

type Props = {
  mode: "granularity" | "range";
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;

  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  onClearRange: () => void;

  kpiSeries: KPISeries; // { bucket, current, previous }
  className?: string;
};

export default function GeneralDataBody({
  mode,
  granularity,
  onGranularityChange,
  startDate,
  endDate,
  onRangeChange,
  onClearRange,
  kpiSeries,
  className = "",
}: Props) {
  const { categories, currData, prevData } = useMemo(() => {
    const current = kpiSeries.current;
    const previous = kpiSeries.previous;

    const n = Math.min(current.length, previous.length);
    const currSlice = current.slice(current.length - n);
    const prevSlice = previous.slice(previous.length - n);

    return {
      categories: currSlice.map((p) => p.label),
      currData: currSlice.map((p) => p.value),
      prevData: prevSlice.map((p) => p.value),
    };
  }, [kpiSeries.current, kpiSeries.previous]);

  return (
    <div
      className={`w-full bg-amber-50/60 dark:bg-white/5 rounded-b-xl border-t border-gray-100 dark:border-white/10 ${className}`}
    >
      <div className="px-4 pt-3 pb-2">
        <RangeControls
          mode={mode}
          granularity={granularity}
          onGranularityChange={onGranularityChange}
          startDate={startDate}
          endDate={endDate}
          onRangeChange={onRangeChange}
          onClearRange={onClearRange}
        />
      </div>

      {/* Contenedor de gráfica -> altura fija; chart ocupa 100% */}
      <div className="px-6 pb-3">
        <div className="w-full h-[300px] md:h-[340px]">
          <LineChart
            categories={categories}
            series={[
              { name: "Actual", data: currData },
              { name: "Anterior", data: prevData },
            ]}
            type="area"
            height="100%" // ⬅️ importante
            showLegend={false}
            smooth
            colorsByName={{ Actual: "#16A34A", Anterior: "#9CA3AF" }}
            className="w-full h-full" // ⬅️ importante
          />
        </div>
      </div>
    </div>
  );
}
