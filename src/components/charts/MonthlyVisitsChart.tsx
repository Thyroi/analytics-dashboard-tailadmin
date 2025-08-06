"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ApexSeries = { name: string; data: number[] }[];

export default function MonthlyVisitsChart() {
  const [series, setSeries] = useState<ApexSeries>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  const isDark = theme === "dark";

  // Fetch de datos
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics/monthly");
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
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
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
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      theme: isDark ? "dark" : "light",
      style: {
        fontSize: "14px",
        fontFamily: "Outfit, sans-serif",
      },
      x: {
        show: false, // Ocultamos el mes arriba
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Visitas mensuales
        </h3>

        {/* Dropdown con Heroicons */}
        <div className="relative">
          <button
            onClick={toggleDropdown}
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

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <ReactApexChart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}
