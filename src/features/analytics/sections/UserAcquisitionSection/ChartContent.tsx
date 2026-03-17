import LineChart from "@/components/charts/LineChart";
import Header from "@/components/common/Header";
import type { Granularity } from "@/lib/types";
import { formatNormalizedChartLabel } from "@/lib/utils/charts/labelFormatting";
import type { ApexOptions } from "apexcharts";
import { UserPlus } from "lucide-react";

interface ChartContentProps {
  granularity: Granularity;
  categories: string[];
  series: { name: string; data: number[] }[];
  colorsByName: Record<string, string>;
  error?: Error | null;
  hasData: boolean;
}

function formatXAxisTickLabel(value: string, granularity: Granularity): string {
  return formatNormalizedChartLabel(value, granularity);
}

function formatTooltipDate(value: string): string {
  const raw = String(value ?? "").trim();
  const isoDay = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const isoMonth = raw.match(/^(\d{4})-(\d{2})$/);

  if (isoDay) {
    const year = isoDay[1];
    const month = formatNormalizedChartLabel(`${isoDay[1]}-${isoDay[2]}`, "y");
    const day = isoDay[3];
    return `${day}-${month}-${year}`;
  }

  if (isoMonth) {
    const year = isoMonth[1];
    const month = formatNormalizedChartLabel(raw, "y");
    return `${month}-${year}`;
  }

  return raw;
}

export function ChartContent({
  granularity,
  categories,
  series,
  colorsByName,
  error,
  hasData,
}: ChartContentProps) {
  const chartOptionsExtra: ApexOptions = {
    xaxis: {
      labels: {
        formatter: (value: string) => formatXAxisTickLabel(value, granularity),
        style: { colors: "#FB923C" },
        ...(granularity === "m" && { showDuplicates: false }),
      },
      axisBorder: { color: "#FB923C" },
      axisTicks: { color: "#FB923C" },
      ...(granularity === "m" && { tickAmount: 4 }),
    },
    yaxis: { labels: { style: { colors: "#FB923C" } } },
    tooltip: {
      x: {
        formatter: (_value: number, opts?: unknown) => {
          const dataPointIndex =
            typeof opts === "object" &&
            opts !== null &&
            "dataPointIndex" in opts &&
            typeof (opts as { dataPointIndex?: number }).dataPointIndex ===
              "number"
              ? (opts as { dataPointIndex: number }).dataPointIndex
              : -1;

          if (dataPointIndex >= 0 && dataPointIndex < categories.length) {
            return formatTooltipDate(categories[dataPointIndex]);
          }

          return formatTooltipDate(String(_value ?? ""));
        },
      },
    },
    grid: {
      borderColor: "rgba(251,146,60,0.3)",
      padding: { left: -10, right: 20, top: 0, bottom: 0 },
    },
  };

  return (
    <div className="user-acquisition-chart card bg-analytics-gradient h-full flex flex-col overflow-visible">
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

      <div className="card-body flex-1 min-h-[340px] overflow-visible">
        <div className="h-full min-h-0 overflow-visible">
          {error ? (
            <div className="text-sm text-red-500 flex items-center justify-center h-full">
              {error.message}
            </div>
          ) : hasData ? (
            <LineChart
              className="overflow-visible"
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
      <style jsx global>{`
        .user-acquisition-chart .apexcharts-tooltip {
          z-index: 80 !important;
        }
      `}</style>
    </div>
  );
}
