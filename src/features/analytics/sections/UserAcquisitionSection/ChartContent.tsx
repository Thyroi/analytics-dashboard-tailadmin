import LineChart from "@/components/charts/LineChart";
import Header from "@/components/common/Header";
import type { Granularity } from "@/lib/types";
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

const SPANISH_MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatUserAcquisitionLabel(
  value: string,
  granularity: Granularity,
): string {
  const raw = String(value ?? "").trim();

  const isoDay = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const isoMonth = raw.match(/^(\d{4})-(\d{2})$/);

  if (granularity === "d") {
    if (isoDay) return isoDay[3];
    return raw;
  }

  if (granularity === "w") {
    if (isoDay) {
      const month = SPANISH_MONTHS[Number(isoDay[2]) - 1];
      return month ? `${month}-${isoDay[3]}` : raw;
    }
    return raw;
  }

  if (granularity === "m") {
    if (isoDay) return isoDay[3];
    return raw;
  }

  if (granularity === "y") {
    if (isoMonth) {
      const month = SPANISH_MONTHS[Number(isoMonth[2]) - 1];
      return month ?? raw;
    }
    if (isoDay) {
      const month = SPANISH_MONTHS[Number(isoDay[2]) - 1];
      return month ?? raw;
    }
  }

  return raw;
}

function formatXAxisTickLabel(value: string, granularity: Granularity): string {
  const baseLabel = formatUserAcquisitionLabel(value, granularity);

  if (granularity === "m") {
    const day = Number.parseInt(baseLabel, 10);
    if (!Number.isFinite(day)) return baseLabel;
    return day % 4 === 1 ? baseLabel : "";
  }

  return baseLabel;
}

function formatTooltipDate(value: string): string {
  const raw = String(value ?? "").trim();
  const isoDay = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const isoMonth = raw.match(/^(\d{4})-(\d{2})$/);

  if (isoDay) {
    const year = isoDay[1];
    const month = SPANISH_MONTHS[Number(isoDay[2]) - 1] ?? isoDay[2];
    const day = isoDay[3];
    return `${day}-${month}-${year}`;
  }

  if (isoMonth) {
    const year = isoMonth[1];
    const month = SPANISH_MONTHS[Number(isoMonth[2]) - 1] ?? isoMonth[2];
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
      },
      axisBorder: { color: "#FB923C" },
      axisTicks: { color: "#FB923C" },
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
