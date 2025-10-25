"use client";

import GroupedBarChart from "@/components/charts/GroupedBarChart";
import LineChart from "@/components/charts/LineChart";
import type { Granularity, KPISeries } from "@/lib/types"; // ⬅️ ACTUALIZADO
import { formatChartLabelsSimple } from "@/lib/utils/charts/labelFormatting";
import { getSeriesLabels } from "@/lib/utils/charts/tooltipLabels";
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
  kpiSeries,
  granularity,
  className = "",
}: Props) {
  const { categories, currData, prevData } = useMemo(() => {
    const current = kpiSeries.current;
    const previous = kpiSeries.previous;

    const n = Math.min(current.length, previous.length);
    const currSlice = current.slice(current.length - n);
    const prevSlice = previous.slice(previous.length - n);

    const rawCategories = currSlice.map((p) => p.label);
    return {
      categories: formatChartLabelsSimple(rawCategories, granularity),
      currData: currSlice.map((p) => p.value),
      prevData: prevSlice.map((p) => p.value),
    };
  }, [kpiSeries, granularity]);

  // Obtener labels según granularidad
  const seriesLabels = useMemo(() => getSeriesLabels(granularity), [granularity]);

  // Para granularidad 'd': usar GroupedBarChart para comparar día actual vs anterior
  if (granularity === "d") {
    return (
      <div
        className={`w-full bg-amber-50/60 dark:bg-gray-900/50 rounded-b-xl border-t border-gray-200 dark:border-gray-600 ${className}`}
      >
        <div className="px-6 pb-6 pt-4">
          <GroupedBarChart
            categories={categories}
            series={[
              { name: seriesLabels.previous, data: prevData, color: "#9CA3AF" },
              { name: seriesLabels.current, data: currData, color: "#16A34A" },
            ]}
            height={300}
            showLegend={true}
            legendPosition="top"
            tooltipFormatter={(val) => val.toLocaleString("es-ES")}
            yAxisFormatter={(val) => `${Math.round(val)}`}
            optionsExtra={{
              states: {
                hover: {
                  filter: {
                    type: "none", // Desactivar efecto de hover
                  },
                },
                active: {
                  filter: {
                    type: "none", // Desactivar efecto de active
                  },
                },
              },
            }}
            className="w-full"
          />
        </div>
      </div>
    );
  }

  // Para otras granularidades: mantener LineChart
  return (
    <div
      className={`w-full bg-amber-50/60 dark:bg-gray-900/50 rounded-b-xl border-t border-gray-200 dark:border-gray-600 ${className}`}
    >
      <div className="pl-6 pr-3 pb-3">
        <div className="w-full h-[300px] md:h-[340px]">
          <LineChart
            categories={categories}
            series={[
              { name: seriesLabels.current, data: currData },
              { name: seriesLabels.previous, data: prevData },
            ]}
            type="area"
            height="100%"
            showLegend={false}
            smooth
            colorsByName={{ 
              [seriesLabels.current]: "#16A34A", 
              [seriesLabels.previous]: "#9CA3AF" 
            }}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
