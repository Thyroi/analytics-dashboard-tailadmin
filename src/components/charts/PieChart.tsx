"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { generateBrandGradient, BRAND_STOPS } from "@/lib/utils/colors";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export type PieDatum = { label: string; value: number };

type DataLabelMode = "percent" | "value" | "none";
type LabelPosition = "inside" | "outside";

type Props = {
  data: PieDatum[];
  type?: "pie" | "donut";
  height?: number;

  /** Si la pasas, se usa tal cual. Si no, se genera gradiente con generateBrandGradient */
  palette?: string[];
  /** Colores fijos por etiqueta (sobrescriben la paleta/gradiente si coincide el label). */
  colorsByLabel?: Record<string, string>;

  showLegend?: boolean;
  legendPosition?: "bottom" | "top" | "right" | "left";

  dataLabels?: DataLabelMode;
  labelPosition?: LabelPosition;

  /** (Nativo Apex, usualmente desactivado si usamos overlay) */
  donutTotalLabel?: string;
  donutTotalFormatter?: (total: number) => string;

  /** Mezcla final de opciones Apex (eventos, responsive, etc.) */
  optionsExtra?: ApexOptions;

  className?: string;

  /** Centrado compacto con % del slice activo (usa labels nativos de Apex) */
  compactHover?: boolean;

  /** Overlay centrado propio (no bloquea eventos del gráfico) */
  centerTop?: string;
  centerBottom?: string;
};

const DEFAULT_HEIGHT = 300;

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
  donutTotalLabel = "Total",
  donutTotalFormatter,
  optionsExtra,
  className = "",
  compactHover = false,
  centerTop,
  centerBottom,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bg = isDark ? "#0b0f14" : "#ffffff";

  // Datos normalizados
  const labels = useMemo(() => data.map((d) => d.label), [data]);
  const series = useMemo(() => data.map((d) => d.value ?? 0), [data]);
  const total = useMemo(() => series.reduce((a, b) => a + b, 0), [series]);

  // Paleta base: si no llega `palette`, generamos N colores entre los BRAND_STOPS
  const basePalette = useMemo(
    () => palette ?? generateBrandGradient(data.length, BRAND_STOPS),
    [palette, data.length]
  );

  // Colores finales por punto: prioriza colorsByLabel -> basePalette
  const colors = useMemo(
    () =>
      data.map((d, i) => {
        const fixed = colorsByLabel?.[d.label];
        return fixed ?? basePalette[i % basePalette.length];
      }),
    [data, colorsByLabel, basePalette]
  );

  const dlEnabled = compactHover ? false : dataLabels !== "none";

  const options: ApexOptions = useMemo(() => {
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
            fontSize: "20px",
            color: isDark ? "#e5e7eb" : "#111827",
            offsetY: -8,
          },
          total: { show: false },
        },
      };

    const defaultDonutLabels:
      NonNullable<NonNullable<ApexOptions["plotOptions"]>["pie"]>["donut"] = {
        size: "58%", // agujero interno (ajústalo si quieres más/menos grosor)
        labels: {
          show: true,
          name: { show: false },
          value: { show: false },
          total: {
            show: false,
            // Si quisieras usar el centro nativo:
            // show: true,
            // showAlways: true,
            // label: donutTotalLabel,
            // formatter: () => donutTotalFormatter ? donutTotalFormatter(total) : Intl.NumberFormat().format(total),
          },
        },
      };

    const plotOptions: ApexOptions["plotOptions"] = {
      pie: {
        expandOnClick: false,
        donut: type === "donut" ? (compactHover ? compactDonutLabels : defaultDonutLabels) : undefined,
        dataLabels: {
          offset: labelPosition === "outside" ? 22 : 0,
          minAngleToShowLabel: 8,
        },
        offsetY: 10,
      },
    };

    const base: ApexOptions = {
      chart: {
        type,
        height,
        parentHeightOffset: 0,
        toolbar: { show: false },
        foreColor: isDark ? "#e5e7eb" : "#111827",
        fontFamily:
          "Outfit, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
      },
      labels,
      legend: {
        show: showLegend,
        position: legendPosition,
        horizontalAlign: "center",
        labels: { colors: isDark ? "#cbd5e1" : "#374151" },
        itemMargin: { horizontal: 10, vertical: 4 },
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
            ? (percent: number) => `${percent.toFixed(0)}%`
            : dataLabels === "value"
            ? (v: number) => Intl.NumberFormat().format(v)
            : undefined,
        dropShadow: { enabled: false },
        style: { fontSize: "12px", fontWeight: 700 },
      },
      stroke: { width: 3, colors: [bg] },
      colors,
      plotOptions,
      states: {
        hover: { filter: { type: "none" } },
        active: { filter: { type: "none" } },
      },
      grid: { padding: { top: 0, bottom: 8, left: 8, right: 8 } },
    };

    return { ...base, ...(optionsExtra ?? {}) };
  }, [
    bg,
    compactHover,
    dataLabels,
    height,
    isDark,
    labelPosition,
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
    `${type}-${labelPosition}-${compactHover ? "compact" : "default"}-` +
    `${isDark ? "dark" : "light"}-` +
    `${labels.join("|")}__${series.join(",")}`;

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
    <div className={`relative w-full overflow-hidden ${className}`}>
      <ReactApexChart key={key} options={options} series={series} type={type} height={height} />
      {(centerTop || centerBottom) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-tight">
          {centerTop && (
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {centerTop}
            </span>
          )}
          {centerBottom && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {centerBottom}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
