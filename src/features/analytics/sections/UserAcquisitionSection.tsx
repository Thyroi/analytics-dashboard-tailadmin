"use client";

import LineChart from "@/components/charts/LineChart";
import Header from "@/components/common/Header";
import { AreaChartSkeleton } from "@/components/skeletons";
import { useUserAcquisitionRange } from "@/features/analytics/hooks/useUserAcquisitionRange";
import { buildSeriesColorMap } from "@/lib/utils/colors";
import { UserPlus } from "lucide-react";
import { useHeaderAnalyticsTimeframe } from "../context/HeaderAnalyticsTimeContext";

const CHART_HEIGHT = 310;
const FIXED_TOTAL_COLOR = "#FF6B35";

type LegacyPayload = { categoriesLabels?: string[] };

export default function UserAcquisitionSection() {
  const { mode, granularity, startISO, endISO } = useHeaderAnalyticsTimeframe();

  const useExplicit = mode === "range";
  const { data, isLoading, error, hasData } = useUserAcquisitionRange({
    start: useExplicit ? startISO : undefined,
    end: useExplicit ? endISO : undefined,
    granularity,
    includeTotal: true,
  });

  if (isLoading) {
    return (
      <div
        className="card bg-analytics-pastel-diag"
        style={{ height: CHART_HEIGHT }}
      >
        <AreaChartSkeleton height={CHART_HEIGHT} />
      </div>
    );
  }

  const categories: string[] =
    (data?.categoriesLabels as string[] | undefined) ??
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
          title="Adquisición de usuarios por canal"
          Icon={UserPlus}
          iconColor="text-huelva-primary"
          titleSize="xxs"
          titleClassName="font-bold"
        />
      </div>

      <div className="card-body">
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
            height={CHART_HEIGHT}
            colorsByName={colorsByName}
            brandAreaGradient
            showLegend
            legendPosition="bottom"
            smooth
            optionsExtra={{
              xaxis: {
                labels: { style: { colors: "#FB923C" } },
                axisBorder: { color: "#FB923C" },
                axisTicks: { color: "#FB923C" },
              },
              yaxis: {
                labels: { style: { colors: "#FB923C" } },
              },
              grid: {
                borderColor: "rgba(251, 146, 60, 0.3)",
              },
              legend: { show: false },
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
