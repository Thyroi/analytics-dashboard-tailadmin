import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";
import type { Granularity, SeriesPoint } from "@/lib/types";
import { getSeriesLabels } from "@/lib/utils/charts/tooltipLabels";
import dynamic from "next/dynamic";
import DrilldownTitle from "../DrilldownTitle";

const GroupedBarChart = dynamic(
  () => import("@/components/charts/GroupedBarChart"),
  { ssr: false }
);

type EngagementSectionProps = {
  granularity: Granularity;
  categories: string[];
  currData: number[];
  prevData: number[];
  seriesAvgEngagement?: { current: SeriesPoint[]; previous: SeriesPoint[] };
};

export function EngagementSection({
  granularity,
  categories,
  currData,
  prevData,
  seriesAvgEngagement,
}: EngagementSectionProps) {
  return (
    <section className="mb-6">
      <DrilldownTitle name="engagement promedio (s)" color="primary" />
      <div className="mt-3 h-[450px]">
        {granularity === "d" ? (
          // Para granularidad día: GroupedBarChart con 2 barras (previous vs current)
          (() => {
            const labels = getSeriesLabels(granularity);
            const lastCurrent =
              seriesAvgEngagement?.current[
                seriesAvgEngagement.current.length - 1
              ];
            const lastPrevious =
              seriesAvgEngagement?.previous[
                seriesAvgEngagement.previous.length - 1
              ];

            if (!lastCurrent) {
              return (
                <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              );
            }

            const groupedSeries = [
              { name: labels.previous, data: [lastPrevious?.value ?? 0] },
              { name: labels.current, data: [lastCurrent.value] },
            ];

            return (
              <GroupedBarChart
                title="Comparación de engagement"
                subtitle="Promedio de segundos por usuario"
                categories={[lastCurrent.label]}
                series={groupedSeries}
                height={400}
                showLegend={true}
                legendPosition="bottom"
                tooltipFormatter={(val) => `${(val ?? 0).toFixed(2)}s`}
                yAxisFormatter={(val) => (val ?? 0).toString()}
              />
            );
          })()
        ) : (
          // Para otras granularidades: LineChart original
          <ChartSection
            categories={categories}
            currData={currData}
            prevData={prevData}
            granularity={granularity}
          />
        )}
        {categories.length === 0 && granularity !== "d" && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Sin datos suficientes para la granularidad &quot;{granularity}
            &quot;.
          </div>
        )}
      </div>
    </section>
  );
}
