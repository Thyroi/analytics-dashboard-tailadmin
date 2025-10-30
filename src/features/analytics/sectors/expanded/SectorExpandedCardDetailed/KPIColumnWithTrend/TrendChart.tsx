import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";

interface TrendChartProps {
  title: string;
  categories: string[];
  currData: number[];
  prevData: number[];
}

export function TrendChart({
  title,
  categories,
  currData,
  prevData,
}: TrendChartProps) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
        {title}
      </div>
      <ChartSection
        categories={categories}
        currData={currData}
        prevData={prevData}
      />
    </div>
  );
}
