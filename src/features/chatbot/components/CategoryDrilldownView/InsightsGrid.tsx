import type { DonutDatum } from "@/lib/types";

interface InsightCardProps {
  title: string;
  value: string;
}

function InsightCard({ title, value }: InsightCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {title}
      </h3>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

interface InsightsGridProps {
  donutData: DonutDatum[];
  totalInteractions: number;
  subcategoryCount: number;
}

export function InsightsGrid({
  donutData,
  totalInteractions,
  subcategoryCount,
}: InsightsGridProps) {
  const mostPopular =
    donutData.length > 0
      ? donutData.reduce((max, item) => (item.value > max.value ? item : max))
          .label
      : "N/A";

  const average =
    donutData.length > 0
      ? Math.round(totalInteractions / donutData.length).toLocaleString()
      : "0";

  return (
    <div className="px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard title="Subcategoría más popular" value={mostPopular} />
        <InsightCard
          title="Total subcategorías"
          value={subcategoryCount.toString()}
        />
        <InsightCard title="Promedio por subcategoría" value={average} />
      </div>
    </div>
  );
}
