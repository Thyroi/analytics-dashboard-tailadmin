"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { ChartContainer } from "./ChartContainer";
import { ChartHeader } from "./ChartHeader";
import { useChartOptions } from "./chartOptions";
import { useChartColors } from "./colorUtils";
import { DEFAULT_HEIGHT, type GroupedBarChartProps } from "./types";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function GroupedBarChart({
  categories,
  series,
  height = DEFAULT_HEIGHT,
  className = "",
  title,
  subtitle,
  showLegend = true,
  legendPosition = "top",
  defaultColors,
  tooltipFormatter,
  yAxisFormatter,
  optionsExtra,
}: GroupedBarChartProps) {
  const { chartSeries, colors } = useChartColors(series, defaultColors);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        window.dispatchEvent(new Event("resize"));
      } catch {
        // no-op
      }
    }, 0);

    return () => clearTimeout(id);
  }, [categories.length, series.length, height]);

  const options = useChartOptions({
    categories,
    colors,
    height,
    showLegend,
    legendPosition,
    tooltipFormatter,
    yAxisFormatter,
    optionsExtra,
  });

  return (
    <ChartContainer className={className}>
      <ChartHeader title={title} subtitle={subtitle} />

      {/* Chart */}
      <div className="px-6 pb-6">
        <div style={{ height }}>
          <ReactApexChart
            options={options}
            series={chartSeries}
            type="bar"
            height={height}
            width="100%"
          />
        </div>
      </div>
    </ChartContainer>
  );
}

// Export types for external use
export type { GroupedBarSeries } from "./types";

// Componente de ejemplo/demo
export function GroupedBarChartDemo() {
  const demoData = {
    categories: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    series: [
      {
        name: "Shipment",
        data: [80, 60, 70, 40, 70, 45, 45, 55, 58, 50, 65, 75],
        color: "#A8C5DA", // Azul claro
      },
      {
        name: "Delivery",
        data: [87, 47, 65, 23, 75, 67, 73, 85, 25, 70, 85, 90],
        color: "#3B82F6", // Azul fuerte
      },
    ],
  };

  return (
    <GroupedBarChart
      title="Delivery Statistics"
      subtitle="Total number of deliveries 70.5K"
      categories={demoData.categories}
      series={demoData.series}
      height={320}
      showLegend={true}
      tooltipFormatter={(val) => `${val}%`}
      yAxisFormatter={(val) => `${val}%`}
    />
  );
}
