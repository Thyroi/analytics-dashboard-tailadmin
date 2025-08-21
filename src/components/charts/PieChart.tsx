// src/components/charts/PieChart.tsx
"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import PieChartSkeleton from "@/components/skeletons/PieChartSkeleton";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export type PieDatum = { label: string; value: number };
type DataLabelMode = "percent" | "value" | "none";

type Props = {
  data: PieDatum[];
  type?: "pie" | "donut";
  height?: number;
  palette?: string[];
  colorsByLabel?: Record<string, string>;
  showLegend?: boolean;
  legendPosition?: "bottom" | "top" | "right" | "left";
  dataLabels?: DataLabelMode;
  donutTotalLabel?: string;
  donutTotalFormatter?: (total: number) => string;
  optionsExtra?: ApexOptions;
  className?: string;

  /** Skeleton */
  isLoading?: boolean;
  skeletonLegendItems?: number;
};

const DEFAULT_HEIGHT = 300;
const DEFAULT_PALETTE = [
  "#465FFF",
  "#22C55E",
  "#F59E0B",
  "#F163AA",
  "#EF4444",
  "#10B981",
  "#38BDF8",
  "#A78BFA",
];

export default function PieChart({
  data,
  type = "donut",
  height = DEFAULT_HEIGHT,
  palette = DEFAULT_PALETTE,
  colorsByLabel,
  showLegend = true,
  legendPosition = "bottom",
  dataLabels = "percent",
  donutTotalLabel = "Total",
  donutTotalFormatter,
  optionsExtra,
  className = "",
  isLoading = false,
  skeletonLegendItems,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Hooks SIEMPRE al principio (sin early returns)
  const labels = useMemo(() => data.map((d) => d.label), [data]);
  const series = useMemo(() => data.map((d) => d.value), [data]);
  const total = useMemo(() => series.reduce((acc, v) => acc + v, 0), [series]);

  const colors = useMemo(() => {
    const byIndex = (i: number) => palette[i % palette.length];
    return data.map((d, i) => colorsByLabel?.[d.label] ?? byIndex(i));
  }, [data, colorsByLabel, palette]);

  const options: ApexOptions = useMemo(() => {
    const dlEnabled = dataLabels !== "none";
    const base: ApexOptions = {
      chart: {
        type,
        height,
        toolbar: { show: false },
        foreColor: isDark ? "#e5e7eb" : "#111827",
        fontFamily: "Outfit, sans-serif",
      },
      labels,
      legend: {
        show: showLegend,
        position: legendPosition,
        labels: { colors: isDark ? "#cbd5e1" : "#374151" },
      },
      tooltip: {
        theme: isDark ? "dark" : "light",
        y: { formatter: (val: number) => Intl.NumberFormat().format(val) },
      },
      dataLabels: {
        enabled: dlEnabled,
        formatter:
          dataLabels === "percent"
            ? (percent: number) => `${percent.toFixed(1)}%`
            : dataLabels === "value"
            ? (v: number) => Intl.NumberFormat().format(v)
            : undefined,
        dropShadow: { enabled: false },
        style: { fontSize: "12px" },
      },
      colors,
      plotOptions: {
        pie: {
          expandOnClick: true,
          donut:
            type === "donut"
              ? {
                  size: "65%",
                  labels: {
                    show: true,
                    name: {
                      show: true,
                      fontSize: "12px",
                      color: isDark ? "#94a3b8" : "#6b7280",
                    },
                    value: {
                      show: true,
                      fontSize: "16px",
                      color: isDark ? "#e5e7eb" : "#111827",
                      formatter: (v: string) =>
                        Intl.NumberFormat().format(Number(v)),
                    },
                    total: {
                      show: true,
                      label: donutTotalLabel,
                      color: isDark ? "#94a3b8" : "#6b7280",
                      formatter: (w: unknown) => {
                        const gw = w as { globals?: { seriesTotals?: number[] } };
                        const sum = (gw.globals?.seriesTotals ?? []).reduce(
                          (a, b) => a + b,
                          0
                        );
                        const value = sum || total;
                        return donutTotalFormatter
                          ? donutTotalFormatter(value)
                          : Intl.NumberFormat().format(value);
                      },
                    },
                  },
                }
              : undefined,
        },
      },
      stroke: { width: 1, colors: [isDark ? "#0b0f14" : "#ffffff"] },
      states: { hover: { filter: { type: "none" } } },
    };
    return { ...base, ...(optionsExtra ?? {}) };
  }, [
    colors,
    dataLabels,
    donutTotalFormatter,
    donutTotalLabel,
    height,
    isDark,
    labels,
    legendPosition,
    optionsExtra,
    showLegend,
    total,
    type,
  ]);

  // No useMemo: string barato de computar, y así evitamos hooks condicionales
  const key =
    `${type}-${isDark ? "dark" : "light"}-` +
    `${labels.join("|")}__${series.join(",")}`;

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {isLoading ? (
        <PieChartSkeleton
          height={height}
          showLegend={showLegend}
          legendItems={skeletonLegendItems ?? 3}
          className=""
        />
      ) : (
        <ReactApexChart
          key={key}
          options={options}
          series={series}
          type={type}
          height={height}
        />
      )}
    </div>
  );
}
