"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ApexSeries = { name: string; data: number[] }[];

type Props = {
  height?: number;
  wrapInCard?: boolean;   // evitar card doble
  showHeader?: boolean;   // mostrar/ocultar header interno
};

export default function MonthlyVisitsChart({
  height = 180,
  wrapInCard = true,
  showHeader = true,
}: Props) {
  const [series, setSeries] = useState<ApexSeries>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Fetch de datos
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
        if (!cancelled) setTimeout(() => setLoading(false), 120); // anti-flash
      }
    }
    fetchAnalytics();
    return () => { cancelled = true; };
  }, []);

  const options: ApexOptions = {
    colors: [isDark ? "#7592FF" : "#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height,
      toolbar: { show: false },
      animations: { enabled: !loading },
      redrawOnParentResize: false,
      parentHeightOffset: 0,
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
      labels: { style: { fontSize: "12px" } },
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
      style: { fontSize: "14px", fontFamily: "Outfit, sans-serif" },
      x: { show: false },
      y: { formatter: (val: number) => `${val}` },
    },
  };

  const Header = showHeader ? (
    <div className="flex items-center justify-between card-header">
      <h3 className="card-title">Visitas mensuales</h3>
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
  ) : null;

  const Body = (
    <div className="card-body">
      <div className="max-w-full">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          {!loading && series.length > 0 ? (
            <ReactApexChart options={options} series={series} type="bar" height={height} />
          ) : (
            // fallback mínimo si se intenta render sin datos (normalmente no pasa por el gate de skeleton)
            <div style={{ height }} />
          )}
        </div>
      </div>
    </div>
  );

  // Gate de skeleton
  if (loading) {
    return <ChartSkeleton height={height} wrapInCard={wrapInCard} showHeader={showHeader} />;
  }

  if (!wrapInCard) return (<>{Header}{Body}</>);

  return (
    <div className="card overflow-hidden">
      {Header}
      {Body}
    </div>
  );
}
