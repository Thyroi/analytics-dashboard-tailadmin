"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ApexSeries = { name: string; data: number[] }[];

const CHART_HEIGHT = 180;

export default function MonthlyVisitsChart() {
  const [series, setSeries] = useState<ApexSeries>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    let cancelled = false;
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await fetch("/api/analytics/monthly");
        const data: { series?: ApexSeries; categories?: string[] } = await res.json();
        if (!cancelled && data.series && data.categories) {
          setSeries(data.series);
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Error al obtener datos de Analytics:", error);
        if (!cancelled) {
          setSeries([]);
          setCategories([]);
        }
      } finally {
        if (!cancelled) setTimeout(() => setLoading(false), 120);
      }
    }
    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, []);

  const options: ApexOptions = {
    colors: [isDark ? "#7592FF" : "#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: CHART_HEIGHT,
      width: "100%",
      toolbar: { show: false },
      animations: { enabled: !loading },
      redrawOnParentResize: true, // <- reescala
      parentHeightOffset: 0,
    },
    grid: {
      yaxis: { lines: { show: true } },
      padding: { left: 6, right: 6 }, // <- no se corta en bordes
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
    legend: {
      show: false, // una sola serie; ahorra alto y evita empujes
    },
    yaxis: { title: { text: undefined } },
    fill: { opacity: 1 },
    tooltip: {
      theme: isDark ? "dark" : "light",
      style: { fontSize: "14px", fontFamily: "Outfit, sans-serif" },
      x: { show: false },
      y: { formatter: (val: number) => `${val}` },
    },
    responsive: [
      {
        breakpoint: 640, // sm
        options: {
          plotOptions: { bar: { columnWidth: "55%" } },
          xaxis: { labels: { rotate: -45 } },
          grid: { padding: { left: 4, right: 4 } },
        },
      },
      {
        breakpoint: 400, // móviles muy estrechos
        options: {
          plotOptions: { bar: { columnWidth: "65%" } },
          xaxis: { labels: { rotate: -55 } },
        },
      },
    ],
  };

  if (loading) return <ChartSkeleton height={CHART_HEIGHT} />;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between card-header">
        <div>
          <h3 className="card-title">Visitas mensuales</h3>
          <p className="card-subtitle">Usuarios activos por mes</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsOpen((s) => !s)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          {isOpen && (
            <div className="absolute right-0 mt-2 w-40 rounded-lg bg-white border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <button
                onClick={() => setIsOpen(false)}
                className="block w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5 text-left"
              >
                Ver más
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="card-body">
        {/* Contenedor 100% sin min-widths ni márgenes negativos */}
        <div className="w-full">
          {series.length > 0 ? (
            <ReactApexChart options={options} series={series} type="bar" height={CHART_HEIGHT} />
          ) : (
            <div style={{ height: CHART_HEIGHT }} />
          )}
        </div>
      </div>
    </div>
  );
}
