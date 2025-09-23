"use client";

import type { ApexOptions } from "apexcharts";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useMemo } from "react";

export type LineSeries = { name: string; data: number[] };

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const DEFAULT_PALETTE = [
  "#465FFF",
  "#22C55E",
  "#F59E0B",
  "#F163AA",
  "#EF4444",
  "#10B981",
] as const;

type Props = {
  categories: string[];
  series: LineSeries[];
  type?: "line" | "area";
  height?: number | string;
  palette?: readonly string[];
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
  height = "100%",
  palette = DEFAULT_PALETTE,
  colorsByName,
  showLegend = true,
  legendPosition = "bottom",
  smooth = false,
  optionsExtra,
  className = "",
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const colors = useMemo(() => {
    const byIndex = (i: number) => palette[i % palette.length];
    return series.map((s, i) => colorsByName?.[s.name] ?? byIndex(i));
  }, [series, colorsByName, palette]);

  // 🔹 Línea punteada para "Total" (y ancho un poco mayor si quieres)
  const dashArray = useMemo(
    () => series.map((s) => (s.name === "Total" ? 6 : 0)), // 6 = patrón de guiones; 0 = línea sólida
    [series]
  );
  const strokeWidths = useMemo(
    () => series.map((s) => (s.name === "Total" ? 3 : 2)),
    [series]
  );

  const axisLabelColor = isDark ? "#9CA3AF" : "#6B7280";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const foreColor = isDark ? "#E5E7EB" : "#374151";

  const options: ApexOptions = useMemo(() => {
    const base: ApexOptions = {
      chart: {
        fontFamily: "Outfit, sans-serif",
        type,
        height: "100%",
        background: "transparent",
        toolbar: { show: false },
        redrawOnParentResize: true,
        parentHeightOffset: 0,
        foreColor,
      },
      stroke: {
        curve: smooth ? "smooth" : "straight",
        width: strokeWidths,      // ⬅️ un ancho por serie
        dashArray,                // ⬅️ punteado por serie (Total = 6)
      },
      markers: { size: 0, hover: { sizeOffset: 3 } },
      fill:
        type === "area"
          ? { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } }
          : { opacity: 1 },
      grid: {
        borderColor: gridColor,
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } },
        padding: { left: 0, right: 0, top: 0, bottom: 0 },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories,
        tickPlacement: "on",
        labels: {
          style: { fontSize: "12px", colors: axisLabelColor },
          rotate: 0,
          trim: true,
          hideOverlappingLabels: true,
        },
        axisBorder: { show: true, color: gridColor },
        axisTicks: { show: true, color: gridColor },
      },
      yaxis: {
        labels: { style: { fontSize: "12px", colors: axisLabelColor } },
        decimalsInFloat: 0,
      },
      tooltip: { enabled: true, shared: true, theme: isDark ? "dark" : "light" },
      legend: { show: showLegend, position: legendPosition, labels: { colors: foreColor } },
      colors,
    };
    return { ...base, ...(optionsExtra ?? {}) };
  }, [
    axisLabelColor,
    categories,
    colors,
    dashArray,
    foreColor,
    gridColor,
    isDark,
    legendPosition,
    optionsExtra,
    smooth,
    strokeWidths,
    type,
    showLegend,
  ]);

  const key = useMemo(
    () =>
      `${type}-${smooth ? "smooth" : "straight"}-${isDark ? "dark" : "light"}|${categories.length}|${series
        .map((s) => s.name)
        .join(",")}`,
    [type, smooth, isDark, categories.length, series]
  );

  return (
    <div className={`w-full h-full overflow-hidden ${className}`} style={{ height }}>
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
