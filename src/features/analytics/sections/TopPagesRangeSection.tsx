"use client";

import LineChart from "@/components/charts/LineChart";
import Header from "@/components/common/Header";
import { useTopPagesRange } from "@/features/analytics/hooks/useTopPagesRange";
import { buildSeriesColorMap } from "@/lib/utils/formatting/colors";
import { BarChart3 } from "lucide-react";
import { useHeaderAnalyticsTimeframe } from "../context/HeaderAnalyticsTimeContext";

const FIXED_TOTAL_COLOR = "#FF6B35";

type LegacyPayload = { categoriesLabels?: string[] };

export default function TopPagesRangeSection() {
  const { mode, granularity, startISO, endISO } = useHeaderAnalyticsTimeframe();

  const useExplicit = mode === "range";
  const { data, isLoading } = useTopPagesRange({
    start: useExplicit ? startISO : undefined,
    end: useExplicit ? endISO : undefined,
    granularity,
    top: 5,
    includeTotal: true,
  });

  if (isLoading) {
    return (
      <div className="card bg-analytics-gradient flex">
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
        <div className="card-body flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 dark:text-gray-500">
            Cargando gráfico...
          </div>
        </div>
      </div>
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
    <div className="card bg-analytics-gradient flex flex-col">
      <div className="card-header flex-shrink-0">
        <Header
          className="flex items-center h-full"
          title="Top 5 páginas más visitadas"
          Icon={BarChart3}
          iconColor="text-huelva-primary"
          titleSize="xxs"
          titleClassName="font-bold"
        />
      </div>

      <div className="flex-1 w-full">
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
          className="w-full h-full"
          optionsExtra={{
            chart: {
              offsetX: 0,
              offsetY: 0,
              parentHeightOffset: 0,
              width: "100%",
              height: "100%",
            },
            xaxis: {
              labels: {
                style: { colors: "#FB923C" },
                trim: false,
                hideOverlappingLabels: false,
                offsetX: 0,
                offsetY: 0,
                maxHeight: undefined,
              },
              axisBorder: { color: "#FB923C" },
              axisTicks: { color: "#FB923C" },
            },
            yaxis: {
              labels: {
                style: { colors: "#FB923C" },
                offsetX: -5,
              },
            },
            grid: {
              borderColor: "#ffc18e",
              padding: {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
              },
            },
            legend: {
              show: true,
              position: "bottom",
              offsetY: 0,
              offsetX: 0,
              itemMargin: {
                horizontal: 12,
                vertical: 6,
              },
            },
            plotOptions: {
              area: {
                fillTo: "end",
              },
            },
          }}
        />
      </div>
    </div>
  );
}
