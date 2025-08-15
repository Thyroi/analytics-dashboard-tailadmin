// src/components/charts/LineChart.tsx
"use client";

import type { ApexOptions } from "apexcharts";
import { useTheme } from "next-themes"; // <- añadido
import dynamic from "next/dynamic";
import { useMemo } from "react";

export type LineSeries = { name: string; data: number[] };

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const DEFAULT_HEIGHT = 310;
const DEFAULT_PALETTE = [
  "#465FFF",
  "#22C55E",
  "#F59E0B",
  "#F163AA",
  "#EF4444",
  "#10B981",
];

type Props = {
  categories: string[];
  series: LineSeries[];
  type?: "line" | "area";
  height?: number;
  palette?: string[];
  colorsByName?: Record<string, string>;
  showLegend?: boolean;
  legendPosition?: "bottom" | "top" | "right" | "left";
  smooth?: boolean;
  optionsExtra?: ApexOptions;
  className?: string;
};

export default function LineChart({
  categories,
  series,
  type = "line",
  height = DEFAULT_HEIGHT,
  palette = DEFAULT_PALETTE,
  colorsByName,
  showLegend = true,
  legendPosition = "bottom",
  smooth = false,
  optionsExtra,
  className = "",
}: Props) {
  const { theme } = useTheme(); // <- tema actual
  const isDark = theme === "dark";

  const colors = useMemo(() => {
    const byIndex = (i: number) => palette[i % palette.length];
    return series.map((s, i) => colorsByName?.[s.name] ?? byIndex(i));
  }, [series, colorsByName, palette]);

  const options: ApexOptions = useMemo(() => {
    const base: ApexOptions = {
      chart: {
        fontFamily: "Outfit, sans-serif",
        type,
        height,
        toolbar: { show: false },
        redrawOnParentResize: false,
        parentHeightOffset: 0,
      },
      stroke: { curve: smooth ? "smooth" : "straight", width: 2 },
      fill:
        type === "area"
          ? { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } }
          : { opacity: 1 },
      grid: {
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories,
        labels: { style: { fontSize: "12px", colors: "#6B7280" } },
      },
      yaxis: { labels: { style: { fontSize: "12px", colors: "#6B7280" } } },
      tooltip: {
        enabled: true,
        shared: true,
        theme: isDark ? "dark" : "light",
      }, // <- clave
      legend: { show: showLegend, position: legendPosition },
      colors,
    };
    return { ...base, ...(optionsExtra ?? {}) };
  }, [
    categories,
    colors,
    legendPosition,
    optionsExtra,
    type,
    height,
    showLegend,
    smooth,
    isDark,
  ]);

  const key = useMemo(
    () =>
      `${type}-${smooth ? "smooth" : "straight"}-${
        isDark ? "dark" : "light"
      }-${categories.join("|")}__${series.map((s) => s.name).join("|")}`,
    [type, smooth, isDark, categories, series]
  );

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <ReactApexChart
        key={key}
        options={options}
        series={series}
        type={type}
        height={height}
      />
    </div>
  );
}
