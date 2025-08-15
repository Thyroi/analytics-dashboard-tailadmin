"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type Props = {
  labels: string[];
  values: number[];
  height?: number; // default 260
  className?: string;
  /** Mapa de color por nombre (prioritario) */
  colorsByName?: Record<string, string>;
  /** Paleta fallback por índice (si no hay colorsByName) */
  palette?: string[]; // default 6-colors
  /** Tooltip theme */
  tooltipTheme?: "dark" | "light";
  /** Mostrar “Total” en el centro del donut */
  showTotal?: boolean; // default true
  totalLabel?: string; // default "Total"
  /** Personaliza cómo se muestra y el total en tooltip/centro */
  valueFormatter?: (v: number, total: number) => string; // default: "val (xx.x%)"
  totalFormatter?: (total: number) => string; // default: total.toString()

  optionsExtra?: ApexOptions;
};

const DEFAULT_HEIGHT = 260;
const DEFAULT_PALETTE = [
  "#465FFF",
  "#22C55E",
  "#F59E0B",
  "#F163AA",
  "#EF4444",
  "#10B981",
];

export default function DonutChart({
  labels,
  values,
  height = DEFAULT_HEIGHT,
  className = "",
  colorsByName,
  palette = DEFAULT_PALETTE,
  tooltipTheme = "light",
  showTotal = true,
  totalLabel = "Total",
  valueFormatter,
  totalFormatter,
  optionsExtra,
}: Props) {
  const total = useMemo(() => values.reduce((a, b) => a + b, 0), [values]);

  const colors = useMemo(() => {
    const byIndex = (i: number) => palette[i % palette.length];
    return labels.map((name, i) => colorsByName?.[name] ?? byIndex(i));
  }, [labels, colorsByName, palette]);

  const vf = useMemo(
    () =>
      valueFormatter ??
      ((val: number, t: number) =>
        t > 0 ? `${val} (${((val / t) * 100).toFixed(1)}%)` : `${val}`),
    [valueFormatter]
  );

  const tf = useMemo(
    () => totalFormatter ?? ((t: number) => String(t)),
    [totalFormatter]
  );

  const options: ApexOptions = useMemo(() => {
    const base: ApexOptions = {
      chart: {
        type: "donut",
        height,
        toolbar: { show: false },
        parentHeightOffset: 0,
      },
      labels,
      colors,
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: "bottom",
        offsetY: 8,
        labels: { useSeriesColors: false },
      },
      tooltip: {
        theme: tooltipTheme,
        y: { formatter: (val: number) => vf(val, total) },
      },
      plotOptions: {
        pie: {
          expandOnClick: false,
          donut: {
            size: "68%",
            labels: {
              show: true,
              name: { show: true, fontSize: "12px" },
              value: {
                show: true,
                fontSize: "16px",
                formatter: (v: string) => v,
              },
              total: showTotal
                ? {
                    show: true,
                    label: totalLabel,
                    formatter: () => tf(total),
                  }
                : { show: false, label: "" },
            },
          },
        },
      },
      responsive: [
        {
          breakpoint: 640,
          options: { plotOptions: { pie: { donut: { size: "62%" } } } },
        },
        {
          breakpoint: 400,
          options: { plotOptions: { pie: { donut: { size: "58%" } } } },
        },
      ],
    };
    return { ...base, ...(optionsExtra ?? {}) };
  }, [
    colors,
    height,
    labels,
    optionsExtra,
    showTotal,
    tf,
    total,
    tooltipTheme,
    totalLabel,
    vf,
  ]);

  return (
    <div className={`relative z-20 w-full ${className}`} style={{ height }}>
      <ReactApexChart
        options={options}
        series={values}
        type="donut"
        height={height}
      />
    </div>
  );
}
