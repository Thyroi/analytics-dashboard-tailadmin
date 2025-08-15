"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export type BarSeries = { name: string; data: number[] };

type Props = {
  categories: string[];
  series: BarSeries[]; // 1..N series
  height?: number; // default 180
  className?: string;

  /** Colores por nombre de serie (tiene prioridad) */
  colorsByName?: Record<string, string>;
  /** Paleta fallback por índice */
  palette?: string[]; // default: azul
  /** Mostrar leyenda */
  showLegend?: boolean; // default false
  /** Opciones extra de Apex (override fino) */
  optionsExtra?: ApexOptions;
};

const DEFAULT_HEIGHT = 180;
const DEFAULT_PALETTE = ["#465FFF"];

export default function BarChart({
  categories,
  series,
  height = DEFAULT_HEIGHT,
  className = "",
  colorsByName,
  palette = DEFAULT_PALETTE,
  showLegend = false,
  optionsExtra,
}: Props) {
  const colors = useMemo(() => {
    const byIndex = (i: number) => palette[i % palette.length];
    return series.map((s, i) => colorsByName?.[s.name] ?? byIndex(i));
  }, [palette, series, colorsByName]);

  const options: ApexOptions = useMemo(() => {
    const base: ApexOptions = {
      colors,
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "bar",
        height,
        width: "100%",
        toolbar: { show: false },
        redrawOnParentResize: true,
        parentHeightOffset: 0,
      },
      grid: {
        yaxis: { lines: { show: true } },
        padding: { left: 6, right: 6 },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "45%",
          borderRadius: 5,
          borderRadiusApplication: "end",
        },
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 4, colors: ["transparent"] },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { fontSize: "12px" },
          rotate: -35,
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: true,
          minHeight: 24,
          maxHeight: 32,
        },
      },
      legend: { show: showLegend },
      yaxis: { title: { text: undefined } },
      fill: { opacity: 1 },
      tooltip: {
        style: { fontSize: "14px", fontFamily: "Outfit, sans-serif" },
        x: { show: false },
        y: { formatter: (val: number) => `${val}` },
      },
      responsive: [
        {
          breakpoint: 640,
          options: {
            plotOptions: { bar: { columnWidth: "55%" } },
            xaxis: { labels: { rotate: -45 } },
            grid: { padding: { left: 4, right: 4 } },
          },
        },
        {
          breakpoint: 400,
          options: {
            plotOptions: { bar: { columnWidth: "65%" } },
            xaxis: { labels: { rotate: -55 } },
          },
        },
      ],
    };
    return { ...base, ...(optionsExtra ?? {}) };
  }, [categories, colors, height, optionsExtra, showLegend]);

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={height}
      />
    </div>
  );
}
