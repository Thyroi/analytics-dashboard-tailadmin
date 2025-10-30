import LineChart from "@/components/charts/LineChart";
import Header from "@/components/common/Header";
import type { ApexOptions } from "apexcharts";
import { BarChart3 } from "lucide-react";

interface ChartContentProps {
  categories: string[];
  series: { name: string; data: number[] }[];
  colorsByName: Record<string, string>;
}

const chartOptionsExtra: ApexOptions = {
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
};

export function ChartContent({
  categories,
  series,
  colorsByName,
}: ChartContentProps) {
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
          optionsExtra={chartOptionsExtra}
        />
      </div>
    </div>
  );
}
