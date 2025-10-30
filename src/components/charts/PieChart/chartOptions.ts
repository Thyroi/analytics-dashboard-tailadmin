import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import type { DataLabelMode, LabelPosition } from "./types";

type ChartOptionsParams = {
  type: "pie" | "donut";
  height: number;
  labels: string[];
  colors: string[];
  total: number;
  isDark: boolean;
  showLegend: boolean;
  legendPosition: "bottom" | "top" | "right" | "left";
  dataLabels: DataLabelMode;
  labelPosition: LabelPosition;
  compactHover: boolean;
  optionsExtra?: ApexOptions;
};

export function useChartOptions({
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
}: ChartOptionsParams): ApexOptions {
  const dlEnabled = compactHover ? false : dataLabels !== "none";

  return useMemo(() => {
    const compactDonutLabels: NonNullable<
      NonNullable<ApexOptions["plotOptions"]>["pie"]
    >["donut"] = {
      size: "72%",
      labels: {
        show: true,
        name: {
          show: true,
          formatter: (
            _name: string,
            opts?: {
              seriesIndex?: number;
              w?: { globals?: { labels?: string[] } };
            }
          ) => {
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

    const defaultDonutLabels: NonNullable<
      NonNullable<ApexOptions["plotOptions"]>["pie"]
    >["donut"] = {
      size: "58%",
      labels: {
        show: true,
        name: { show: false },
        value: { show: false },
        total: {
          show: false,
        },
      },
    };

    const plotOptions: ApexOptions["plotOptions"] = {
      pie: {
        expandOnClick: false,
        donut:
          type === "donut"
            ? compactHover
              ? compactDonutLabels
              : defaultDonutLabels
            : undefined,
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
      stroke: {
        width: 1,
        colors: [isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.05)"],
      },
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
}
