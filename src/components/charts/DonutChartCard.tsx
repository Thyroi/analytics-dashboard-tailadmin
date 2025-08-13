"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ApiPayload = { labels: string[]; values: number[] };

const CHART_HEIGHT = 260;

// Colores “de marca” por SO; fallback gris para otros
const osColors: Record<string, string> = {
  Windows: "#00A4EF",
  Android: "#3DDC84",
  iOS: "#A3AAAE",
  Macintosh: "#6E6E73",
  Linux: "#F4C20D",
  "Chrome OS": "#5BB974",
  Other: "#9CA3AF",
};

export default function DonutChartCard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [labels, setLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/analytics/devices-os");
        const data: ApiPayload | { error: string } = await res.json();
        if ("error" in data) throw new Error(data.error);
        if (!cancelled) {
          setLabels(data.labels);
          setValues(data.values);
        }
      } catch (e) {
        console.error("Error OS donut:", e);
        if (!cancelled) {
          setLabels([]);
          setValues([]);
        }
      } finally {
        if (!cancelled) setTimeout(() => setLoading(false), 120);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = values.reduce((a, b) => a + b, 0);
  const colors = labels.map((l) => osColors[l] ?? osColors.Other);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      height: CHART_HEIGHT,
      toolbar: { show: false },
      parentHeightOffset: 0,
      animations: { enabled: !loading },
      redrawOnParentResize: true,
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
      theme: isDark ? "dark" : "light",
      y: {
        formatter: (val: number) =>
          total > 0 ? `${val} (${((val / total) * 100).toFixed(1)}%)` : `${val}`,
      },
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: "68%",
          labels: {
            show: true,
            name: { show: true, fontSize: "12px" },
            value: { show: true, fontSize: "16px", formatter: (v: string) => v },
            total: {
              show: true,
              label: "Total",
              formatter: () => String(total),
            },
          },
        },
      },
    },
    responsive: [
      { breakpoint: 640, options: { plotOptions: { pie: { donut: { size: "62%" } } } } },
      { breakpoint: 400, options: { plotOptions: { pie: { donut: { size: "58%" } } } } },
    ],
  };

  if (loading) return <ChartSkeleton height={CHART_HEIGHT} />;

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="card-title">Usuarios por sistema operativo</h3>
      </div>
      <div className="card-body">
        <div className="relative w-full" style={{ height: CHART_HEIGHT }}>
          {values.length > 0 ? (
            <ReactApexChart options={options} series={values} type="donut" height={CHART_HEIGHT} />
          ) : (
            <div className="text-sm text-gray-400 flex items-center justify-center h-full">
              Sin datos en el rango
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

