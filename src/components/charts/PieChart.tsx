"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useMemo } from "react";

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

  /** Donut minimalista (centro dinámico con % del segmento). */
  compactHover?: boolean;
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
  compactHover = false,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Normalizamos entrada
  const labels = useMemo(() => data.map((d) => d.label), [data]);
  const series = useMemo(() => data.map((d) => d.value ?? 0), [data]);
  const total = useMemo(() => series.reduce((a, b) => a + b, 0), [series]);

  // Paleta/colores
  const colors = useMemo(() => {
    const byIndex = (i: number) => palette[i % palette.length];
    return data.map((d, i) => colorsByLabel?.[d.label] ?? byIndex(i));
  }, [data, colorsByLabel, palette]);

  const dlEnabled = compactHover ? false : dataLabels !== "none";

  const options: ApexOptions = useMemo(() => {
    // Donut labels para modo compacto (centro dinámico nombre + %)
    const compactDonutLabels:
      NonNullable<NonNullable<ApexOptions["plotOptions"]>["pie"]>["donut"] = {
      size: "72%",
      labels: {
        show: true,
        name: {
          show: true,
          formatter: (_name: string, opts?: { seriesIndex?: number; w?: { globals?: { labels?: string[] } } }) => {
            const idx = opts?.seriesIndex ?? -1;
            const lbl = idx >= 0 ? opts?.w?.globals?.labels?.[idx] ?? "" : "";
            return String(lbl);
          },
          fontSize: "13px",
          color: isDark ? "#94a3b8" : "#6b7280",
          offsetY: 8,
        },
        value: {
          show: true,
          formatter: (vStr: string) => {
            const v = Number(vStr);
            const pct = total > 0 ? (v / total) * 100 : 0;
            return `${pct.toFixed(1)}%`;
          },
          fontSize: "18px",
          color: isDark ? "#e5e7eb" : "#111827",
          offsetY: -8,
        },
        total: { show: false },
      },
    };

    // Donut labels por defecto (Total en el centro)
    const defaultDonutLabels:
      NonNullable<NonNullable<ApexOptions["plotOptions"]>["pie"]>["donut"] = {
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
          formatter: (v: string) => Intl.NumberFormat().format(Number(v)),
        },
        total: {
          show: true,
          label: donutTotalLabel,
          color: isDark ? "#94a3b8" : "#6b7280",
          formatter: () =>
            donutTotalFormatter
              ? donutTotalFormatter(total)
              : Intl.NumberFormat().format(total),
        },
      },
    };

    const plotOptions: ApexOptions["plotOptions"] = {
      pie: {
        expandOnClick: false,     // evita glitches con leyenda
        donut: type === "donut" ? (compactHover ? compactDonutLabels : defaultDonutLabels) : undefined,
        dataLabels: { offset: 0, minAngleToShowLabel: 10 },
      },
    };

    const base: ApexOptions = {
      chart: {
        type,
        height,
        // 👇 offsets/padding seguros: evitan “node” undefined en Apex
        parentHeightOffset: 0,
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
        y: {
          formatter: (val: number) => Intl.NumberFormat().format(val),
          title: { formatter: (seriesName: string) => seriesName },
        },
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
      plotOptions,
      stroke: { width: 1, colors: [isDark ? "#0b0f14" : "#ffffff"] },
      states: {
        hover: { filter: { type: "none" } },
        active: { filter: { type: "none" } },
      },
      grid: { padding: { top: 0, bottom: 0, left: 0, right: 0 } },
    };

    return { ...base, ...(optionsExtra ?? {}) };
  }, [
    compactHover,
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
    dlEnabled,
    colors,
  ]);

  const key =
    `${type}-${compactHover ? "compact" : "default"}-` +
    `${isDark ? "dark" : "light"}-` +
    `${labels.join("|")}__${series.join(",")}`;

  // Guardas: si no hay valores o la altura es inválida, no montamos Apex
  if (!series.length || height <= 0) {
    return (
      <div className={`w-full overflow-hidden ${className}`}>
        <div
          className="rounded-lg border border-dashed border-gray-200 dark:border-white/10 p-6 text-sm text-gray-500 dark:text-gray-400"
          style={{ height: Math.max(120, height) }}
        >
          Sin datos para mostrar.
        </div>
      </div>
    );
  }

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
