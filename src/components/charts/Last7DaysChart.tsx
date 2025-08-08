"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import LineChartSkeleton from "@/components/skeletons/LineChartSkeleton";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ApexSeries = { name: string; data: number[] }[];

type Props = {
  height?: number;
  wrapInCard?: boolean;  // evita card doble
  showHeader?: boolean;  // muestra/oculta header interno
};

export default function Last7DaysChart({
  height = 200,
  wrapInCard = true,
  showHeader = true,
}: Props) {
  const [series, setSeries] = useState<ApexSeries>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/analytics/last7days");
        const data: { series?: ApexSeries; categories?: string[] } = await res.json();
        if (!cancelled && data.series && data.categories) {
          setSeries(data.series);
          setCategories(data.categories);
        }
      } catch (e) {
        console.error("Error al obtener datos de Analytics:", e);
        if (!cancelled) { setSeries([]); setCategories([]); }
      } finally {
        if (!cancelled) setTimeout(() => setLoading(false), 120); // anti‑flash
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const options: ApexOptions = {
    colors: [isDark ? "#7592FF" : "#465fff"],
    chart: {
      type: "line",
      height,
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      animations: { enabled: !loading },
      redrawOnParentResize: false,
      parentHeightOffset: 0,
    },
    stroke: { curve: "smooth", width: 3 },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "12px" } },
    },
    grid: { yaxis: { lines: { show: true } } },
    tooltip: {
      theme: isDark ? "dark" : "light",
      x: { show: false },
      y: { formatter: (val: number) => `Usuarios activos: ${val}` },
    },
  };

  // Gate de skeleton
  if (loading) {
    return <LineChartSkeleton height={height} wrapInCard={wrapInCard} showHeader={showHeader} />;
  }

  const Header = showHeader ? (
    <div className="card-header">
      <div>
        <h3 className="card-title">Últimos 7 días</h3>
        <p className="card-subtitle">Usuarios activos por día</p>
      </div>
    </div>
  ) : null;

  const Body = (
    <div className="card-body">
      <div className="w-full overflow-hidden">
        {series.length ? (
          <ReactApexChart options={options} series={series} type="line" height={height} />
        ) : (
          <div style={{ height }} />
        )}
      </div>
    </div>
  );

  if (!wrapInCard) return (<>{Header}{Body}</>);

  return (
    <div className="card overflow-hidden">
      {Header}
      {Body}
    </div>
  );
}
