"use client";

import GroupedBarChart, {
  type GroupedBarSeries,
} from "@/components/charts/GroupedBarChart";

type GroupedBarSideProps = {
  categories: string[];
  groupedSeries: GroupedBarSeries[];
  chartTitle?: string;
  chartSubtitle?: string;
  chartHeight?: number;
  tooltipFormatter?: (val: number) => string;
  yAxisFormatter?: (val: number) => string;
  loading?: boolean;
  legendPosition?: "top" | "bottom";
};

export function GroupedBarSide({
  categories,
  groupedSeries,
  chartTitle,
  chartSubtitle,
  chartHeight = 350,
  tooltipFormatter,
  yAxisFormatter,
  loading = false,
  legendPosition = "top",
}: GroupedBarSideProps) {
  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GroupedBarChart
      title={chartTitle}
      subtitle={chartSubtitle}
      categories={categories}
      series={groupedSeries}
      height={chartHeight}
      showLegend={true}
      legendPosition={legendPosition}
      tooltipFormatter={tooltipFormatter}
      yAxisFormatter={yAxisFormatter}
    />
  );
}
