/**
 * Componente de barras comparativas (Current vs Previous)
 * Para mostrar comparación día por día cuando granularity = 'd'
 * Usa ApexCharts siguiendo la estructura del proyecto
 */

"use client";

import dynamic from "next/dynamic";
import { ChartContainer } from "./ChartContainer";
import { ChartHeader } from "./ChartHeader";
import { useChartOptions } from "./chartOptions";
import { useSeriesData } from "./seriesUtils";
import {
  DEFAULT_HEIGHT,
  DEFAULT_TITLE,
  type ComparisonBarChartProps,
} from "./types";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function ComparisonBarChart({
  series,
  title = DEFAULT_TITLE,
  subtitle,
  height = DEFAULT_HEIGHT,
  showLegend = true,
  tooltipFormatter = (value) => value.toLocaleString(),
  yAxisFormatter = (value) => value.toString(),
  className = "",
  granularity = "d",
  optionsExtra,
}: ComparisonBarChartProps) {
  const { categories, chartSeries, colors } = useSeriesData(
    series,
    granularity
  );

  const options = useChartOptions({
    categories,
    colors,
    height,
    showLegend,
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
          />
        </div>
      </div>
    </ChartContainer>
  );
}
