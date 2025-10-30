import LineChart from "@/components/charts/LineChart";
import Header from "@/components/common/Header";
import type { ApexOptions } from "apexcharts";
import { UserPlus } from "lucide-react";

interface ChartContentProps {
  categories: string[];
  series: { name: string; data: number[] }[];
  colorsByName: Record<string, string>;
  error?: Error | null;
  hasData: boolean;
}

const chartOptionsExtra: ApexOptions = {
  xaxis: {
    labels: { style: { colors: "#FB923C" } },
    axisBorder: { color: "#FB923C" },
    axisTicks: { color: "#FB923C" },
  },
  yaxis: { labels: { style: { colors: "#FB923C" } } },
  grid: { borderColor: "rgba(251,146,60,0.3)" },
};

export function ChartContent({
  categories,
  series,
  colorsByName,
  error,
  hasData,
}: ChartContentProps) {
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

      <div className="card-body h-[340px] md:h-[380px] lg:h-[420px]">
        <div className="h-full min-h-0">
          {error ? (
            <div className="text-sm text-red-500 flex items-center justify-center h-full">
              {error.message}
            </div>
          ) : hasData ? (
            <LineChart
              categories={categories}
              series={series}
              type="area"
              height="100%"
              colorsByName={colorsByName}
              brandAreaGradient
              showLegend={false}
              smooth
              optionsExtra={chartOptionsExtra}
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
