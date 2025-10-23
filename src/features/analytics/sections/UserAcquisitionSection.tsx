"use client";

import LineChart from "@/components/charts/LineChart";
import Header from "@/components/common/Header";
import { useUserAcquisitionRange } from "@/features/analytics/hooks/useUserAcquisitionRange";
import { formatChartLabelsSimple } from "@/lib/utils/charts/labelFormatting";
import { buildSeriesColorMap } from "@/lib/utils/formatting/colors";
import { UserPlus } from "lucide-react";
import { useHeaderAnalyticsTimeframe } from "../context/HeaderAnalyticsTimeContext";
import { ChartSectionSkeleton } from "../skeletons";

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
    return <ChartSectionSkeleton />;
  }

  const rawCategories: string[] =
    (data?.categoriesLabels as string[] | undefined) ??
    (data as unknown as LegacyPayload | null)?.categoriesLabels ??
    [];

  const categories = formatChartLabelsSimple(rawCategories, granularity);

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

      {/* El contenedor define el alto; el chart ocupa 100% */}
      <div className="card-body h-[340px] md:h-[380px] lg:h-[420px]">
        <div className="h-full min-h-0">
          {error ? (
            <div className="text-sm text-red-500 flex items-center justify-center h-full">
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
              showLegend={false}
              smooth
              optionsExtra={{
                xaxis: {
                  labels: { style: { colors: "#FB923C" } },
                  axisBorder: { color: "#FB923C" },
                  axisTicks: { color: "#FB923C" },
                },
                yaxis: { labels: { style: { colors: "#FB923C" } } },
                grid: { borderColor: "rgba(251,146,60,0.3)" },
              }}
            />
          ) : (
            <div className="text-sm text-gray-400 flex items-center justify-center h-full">
              Sin datos en el rango
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
