"use client";

import LineChart from "@/components/charts/LineChart";
import Header from "@/components/common/Header";
import { useTopPagesRange } from "@/features/analytics/hooks/useTopPagesRange";
import { buildSeriesColorMap } from "@/lib/utils/formatting/colors";
import { BarChart3 } from "lucide-react";
import { useHeaderAnalyticsTimeframe } from "../context/HeaderAnalyticsTimeContext";

const CHART_HEIGHT = 310;
const FIXED_TOTAL_COLOR = "#FF6B35";

type LegacyPayload = { categoriesLabels?: string[] };

export default function TopPagesRangeSection() {
  const { mode, granularity, startISO, endISO } = useHeaderAnalyticsTimeframe();

  const useExplicit = mode === "range";
  const { data, isLoading, error, hasData } = useTopPagesRange({
    start: useExplicit ? startISO : undefined,
    end: useExplicit ? endISO : undefined,
    granularity,
    top: 5,
    includeTotal: true,
  });

  if (isLoading) {
    return (
      <div
        className="card bg-gradient-to-b from-[#FFF7ED] to-white"
        style={{ height: CHART_HEIGHT }}
      />
    );
  }

  const categories: string[] =
    data?.xLabels ??
    (data as unknown as LegacyPayload | null)?.categoriesLabels ??
    [];

  const series = data?.series ?? [];
  const seriesNames = series.map((s) => s.name);
  const colorsByName = buildSeriesColorMap(seriesNames, {
    Total: FIXED_TOTAL_COLOR,
  });

  return (
    <div className="card bg-analytics-gradient">
      <div className="card-header">
        <Header
          className="flex items-center h-full"
          title="Top 5 páginas más visitadas"
          Icon={BarChart3}
          iconColor="text-huelva-primary"
          titleSize="xxs"
          titleClassName="font-bold"
        />
      </div>

      <div className="card-body h-[400px]">
        {error ? (
          <div
            className="text-sm text-red-500 flex items-center justify-center"
            style={{ height: CHART_HEIGHT }}
          >
            {error.message}
          </div>
        ) : hasData && data ? (
          <LineChart
            categories={categories}
            series={series}
            type="area"
            height="100%"
            colorsByName={colorsByName}
            brandAreaGradient
            showLegend
            legendPosition="bottom"
            smooth
            optionsExtra={{
              xaxis: {
                labels: { style: { colors: "#FB923C" } }, // texto eje X
                axisBorder: { color: "#FB923C" }, // línea base eje X
                axisTicks: { color: "#FB923C" }, // ticks eje X
              },
              yaxis: {
                labels: { style: { colors: "#FB923C" } }, // texto eje Y
              },
              grid: {
                borderColor: "#ffc18e", // líneas de la grid
              },
            }}
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
