"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ApexSeries = { name: string; data: number[] }[];

export default function Last7DaysChart() {
  const [series, setSeries] = useState<ApexSeries>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const { theme } = useTheme();

  const isDark = theme === "dark";

  // Fetch datos del endpoint
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics/last7days");
        const data = await res.json();

        if (data.series && data.categories) {
          setSeries(data.series);
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Error al obtener datos de Analytics:", error);
      }
    }
    fetchAnalytics();
  }, []);

  const options: ApexOptions = {
    colors: [isDark ? "#7592FF" : "#465fff"],
    chart: {
      type: "line",
      height: 200,
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: { yaxis: { lines: { show: true } } },
    tooltip: {
      theme: isDark ? "dark" : "light",
      x: { show: false },
      y: {
        formatter: (val: number) => `Usuarios activos: ${val}`,
      },
    },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Últimos 7 días
      </h3>
      <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
        <ReactApexChart options={options} series={series} type="line" height={200} />
      </div>
    </div>
  );
}
