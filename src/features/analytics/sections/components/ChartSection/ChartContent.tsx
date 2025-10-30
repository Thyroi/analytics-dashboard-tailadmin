import dynamic from "next/dynamic";
import { CHART_HEIGHT } from "./constants";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ChartContentProps {
  chartData: {
    series: Array<{
      name: string;
      data: Array<{ x: string; y: number }>;
      color: string;
    }>;
    categories: string[];
  };
  formatNumber: (value: number) => string;
}

export function ChartContent({ chartData, formatNumber }: ChartContentProps) {
  return (
    <div className="h-80">
      <ReactApexChart
        options={{
          chart: {
            type: "line",
            height: CHART_HEIGHT,
            toolbar: { show: false },
            background: "transparent",
            events: {},
            zoom: {
              enabled: false,
              type: "x",
              autoScaleYaxis: false,
            },
          },
          theme: {
            mode: "light",
          },
          colors: chartData.series.map((s) => s?.color).filter(Boolean),
          stroke: {
            width: 2,
            curve: "smooth",
          },
          xaxis: {
            categories: chartData.categories,
            labels: {
              style: {
                colors: "var(--apexcharts-text-color)",
              },
            },
          },
          yaxis: {
            labels: {
              style: {
                colors: "var(--apexcharts-text-color)",
              },
              formatter: (value: number) => formatNumber(value),
            },
          },
          grid: {
            borderColor: "var(--apexcharts-grid-color)",
            strokeDashArray: 3,
          },
          legend: {
            position: "bottom",
            labels: {
              colors: "var(--apexcharts-text-color)",
            },
          },
          tooltip: {
            theme: "dark",
            y: {
              formatter: (value: number) => `${formatNumber(value)} visitas`,
            },
          },
        }}
        series={chartData.series.filter(
          (s): s is NonNullable<typeof s> => s !== null
        )}
        type="line"
        height={CHART_HEIGHT}
      />
    </div>
  );
}
