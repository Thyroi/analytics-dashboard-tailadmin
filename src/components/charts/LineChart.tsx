// src/components/charts/LineChart.tsx
"use client";

import type { ApexOptions } from "apexcharts";
import { useTheme } from "next-themes";
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
] as const;

type Props = {
  categories: string[];
  series: LineSeries[];
  type?: "line" | "area";
  height?: number;
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
  height = DEFAULT_HEIGHT,
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

  // Colores: primero por nombre de serie, luego por índice en la paleta
  const colors = useMemo(() => {
    const byIndex = (i: number) => palette[i % palette.length];
    return series.map((s, i) => colorsByName?.[s.name] ?? byIndex(i));
  }, [series, colorsByName, palette]);

  // Tokens dependientes del tema
  const axisLabelColor = isDark ? "#9CA3AF" : "#6B7280";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const foreColor = isDark ? "#E5E7EB" : "#374151";

  const options: ApexOptions = useMemo(() => {
    const base: ApexOptions = {
      chart: {
        fontFamily: "Outfit, sans-serif",
        type,
        height,
        background: "transparent",
        toolbar: { show: false },
        redrawOnParentResize: false,
        parentHeightOffset: 0,
        foreColor, // labels/legend/tooltip coherentes con el tema
      },
      stroke: { curve: smooth ? "smooth" : "straight", width: 2 },
      markers: { size: 0, hover: { sizeOffset: 3 } },
      fill:
        type === "area"
          ? { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } }
          : { opacity: 1 },
      grid: {
        borderColor: gridColor,
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories,
        labels: { style: { fontSize: "12px", colors: axisLabelColor } },
        axisBorder: { show: true, color: gridColor },
        axisTicks: { show: true, color: gridColor },
        tickAmount: undefined, // dejar que Apex decida; se puede ajustar por rango
      },
      yaxis: {
        labels: { style: { fontSize: "12px", colors: axisLabelColor } },
        decimalsInFloat: 0,
      },
      tooltip: {
        enabled: true,
        shared: true,
        theme: isDark ? "dark" : "light",
      },
      legend: {
        show: showLegend,
        position: legendPosition,
        labels: { colors: foreColor },
      },
      colors,
    };

    return { ...base, ...(optionsExtra ?? {}) };
  }, [
    axisLabelColor,
    categories,
    colors,
    foreColor,
    gridColor,
    height,
    isDark,
    legendPosition,
    optionsExtra,
    smooth,
    type,
    showLegend,
  ]);

  // Re-render controlado cuando cambian props claves/tema
  const key = useMemo(
    () =>
      `${type}-${smooth ? "smooth" : "straight"}-${
        isDark ? "dark" : "light"
      }|${categories.join(",")}|${series.map((s) => s.name).join(",")}`,
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
