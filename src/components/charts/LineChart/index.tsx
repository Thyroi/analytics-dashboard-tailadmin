"use client";

import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { DEFAULT_PALETTE } from "./constants";
import type { LineChartProps } from "./types";
import { useChartOptions } from "./useChartOptions";
import { useFillConfig } from "./useFillConfig";
import { useLineChartStyles } from "./useLineChartStyles";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function LineChart({
  categories,
  series,
  type = "line",
  height = "100%",
  palette = DEFAULT_PALETTE,
  colorsByName,
  showLegend = true,
  legendPosition = "bottom",
  smooth = false,
  optionsExtra,
  className = "",
  brandAreaGradient = false,
}: LineChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { colors, dashArray, strokeWidths } = useLineChartStyles(
    series,
    colorsByName,
    palette
  );

  const fill = useFillConfig(type, brandAreaGradient);

  const options = useChartOptions(
    type,
    categories,
    colors,
    dashArray,
    strokeWidths,
    smooth,
    fill,
    showLegend,
    legendPosition,
    isDark,
    optionsExtra
  );

  const key = useMemo(
    () =>
      `${type}-${smooth ? "smooth" : "straight"}-${isDark ? "dark" : "light"}|${
        categories.length
      }|${series.map((s) => s.name).join(",")}`,
    [type, smooth, isDark, categories.length, series]
  );

  return (
    <div
      className={`w-full h-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <ReactApexChart
        key={key}
        options={options}
        series={series}
        type={type}
        height="100%"
        width="100%"
      />
    </div>
  );
}

// Export types for external use
export type { LineSeries } from "./types";
