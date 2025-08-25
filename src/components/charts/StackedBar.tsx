"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export type BarSeries = { name: string; data: number[] };

type Props = {
  categories: string[];
  series: BarSeries[];
  height?: number | string;
  colorsByName?: Record<string, string>;
  palette?: string[];
  className?: string;
};

const DEFAULT_COLORS = [
  "#465FFF", "#22C55E", "#F59E0B", "#EF4444", "#10B981",
  "#38BDF8", "#A78BFA", "#F97316", "#14B8A6", "#8B5CF6",
];

export default function StackedBar({
  categories,
  series,
  height = 220,
  colorsByName,
  palette = DEFAULT_COLORS,
  className = "",
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const colors = useMemo(() => {
    const byIndex = (i: number) => palette[i % palette.length];
    return series.map((s, i) => colorsByName?.[s.name] ?? byIndex(i));
  }, [series, colorsByName, palette]);

  const options: ApexOptions = useMemo(() => ({
    chart: {
      type: "bar",
      stacked: true,
      height,
      toolbar: { show: false },
      foreColor: isDark ? "#e5e7eb" : "#111827",
      fontFamily: "Outfit, sans-serif",
    },
    plotOptions: {
      bar: {
        columnWidth: "55%",
        borderRadius: 6,
        borderRadiusApplication: "end",
      },
    },
    xaxis: { categories, labels: { rotate: -45 } },
    yaxis: { labels: { formatter: (v) => `${Math.round(v)}` } },
    dataLabels: { enabled: false },
    tooltip: { theme: isDark ? "dark" : "light" },
    legend: { position: "bottom" },
    colors,
    grid: { yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
  }), [categories, colors, height, isDark]);

  const key = `${isDark ? "dark" : "light"}-${categories.join("|")}__${series.map(s=>s.name).join("|")}`;

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <ReactApexChart key={key} options={options} series={series} type="bar" height={height} />
    </div>
  );
}
