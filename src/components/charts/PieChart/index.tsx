"use client";

import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { CenterOverlay } from "./CenterOverlay";
import { EmptyState } from "./EmptyState";
import { useChartOptions } from "./chartOptions";
import { useChartColors } from "./colorUtils";
import {
  DEFAULT_EMPTY_TEXT,
  DEFAULT_HEIGHT,
  type PieChartProps,
} from "./types";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function PieChart({
  data,
  type = "donut",
  height = DEFAULT_HEIGHT,
  palette,
  colorsByLabel,
  showLegend = true,
  legendPosition = "bottom",
  dataLabels = "percent",
  labelPosition = "outside",
  optionsExtra,
  className = "",
  compactHover = false,
  centerTop,
  centerBottom,
  emptyIcon,
  emptyText = DEFAULT_EMPTY_TEXT,
}: PieChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const labels = useMemo(() => data.map((d) => d.label), [data]);
  const series = useMemo(() => data.map((d) => d.value ?? 0), [data]);
  const total = useMemo(() => series.reduce((a, b) => a + b, 0), [series]);

  const colors = useChartColors(data, palette, colorsByLabel);

  const options = useChartOptions({
    type,
    height,
    labels,
    colors,
    total,
    isDark,
    showLegend,
    legendPosition,
    dataLabels,
    labelPosition,
    compactHover,
    optionsExtra,
  });

  const key =
    `${type}-${labelPosition}-${compactHover ? "compact" : "default"}-` +
    `${isDark ? "dark" : "light"}-` +
    `${labels.join("|")}__${series.join(",")}`;

  // Estado vacío con icono centrado
  if (!series.length || height <= 0) {
    return (
      <EmptyState
        height={height}
        className={className}
        emptyIcon={emptyIcon}
        emptyText={emptyText}
      />
    );
  }

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <ReactApexChart
        key={key}
        options={options}
        series={series}
        type={type}
        height={height}
      />
      <CenterOverlay centerTop={centerTop} centerBottom={centerBottom} />
    </div>
  );
}

// Export types for external use
export type { PieDatum } from "./types";
