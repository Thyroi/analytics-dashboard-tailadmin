"use client";

import LineChart from "@/components/charts/LineChart";
import DateRangePicker from "@/components/common/DateRangePicker";
import { AreaChartSkeleton } from "@/components/skeletons";
import { useTopPagesRange } from "@/features/analytics/hooks/useTopPagesRange";
import { useState } from "react";

const CHART_HEIGHT = 310;
const toISO = (d: Date) => d.toISOString().split("T")[0];

// Colores opcionales por nombre (Total + fallback por índice en tu LineChart)
const NAME_COLORS: Record<string, string> = {
  Total: "#93C5FD",
};

export default function TopPagesRangeSection() {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setMonth(today.getMonth() - 1);

  const [startDate, setStartDate] = useState<Date>(monthAgo);
  const [endDate, setEndDate] = useState<Date>(today);

  const { data, isLoading, error, hasData } = useTopPagesRange({
    start: toISO(startDate),
    end: toISO(endDate),
    granularity: "d",
    top: 5,
    includeTotal: true,
  });

  if (isLoading) return <AreaChartSkeleton height={CHART_HEIGHT} />;

  // Fallback por compatibilidad si en algún build viejo llega categoriesLabels
  const categories =
    (data?.xLabels as string[] | undefined) ??
    ((data as unknown as { categoriesLabels?: string[] })?.categoriesLabels ?? []);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Top 5 páginas más visitadas</h3>
          <p className="card-subtitle">
            Vistas (screenPageViews) por día y título de página
          </p>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onRangeChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
          }}
        />
      </div>

      <div className="card-body h-[400px]">
        {error ? (
          <div
            className="h-[ text-sm text-red-500 flex items-center justify-center"
            style={{ height: CHART_HEIGHT }}
          >
            {error.message}
          </div>
        ) : hasData && data ? (
          <LineChart
            categories={categories}
            series={data.series}
            type="line"
            height="100%"
            colorsByName={NAME_COLORS}
            showLegend
            legendPosition="bottom"
          />
        ) : (
          <div
            className="text-sm text-gray-400 flex items-center justify-center"
            style={{ height: CHART_HEIGHT }}
          >
            Sin datos en el rango
          </div>
        )}
      </div>
    </div>
  );
}
