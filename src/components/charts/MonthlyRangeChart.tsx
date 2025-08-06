"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ChartData = {
  categories: string[];
  series: number[];
};

export default function MonthlyRangeChart() {
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);

  const [startDate, setStartDate] = useState<Date>(lastMonth);
  const [endDate, setEndDate] = useState<Date>(today);
  const [chartData, setChartData] = useState<ChartData>({ categories: [], series: [] });
  const [loading, setLoading] = useState(false);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const fetchData = async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics/monthly-range?start=${formatDate(start)}&end=${formatDate(end)}`
      );
      const data = await res.json();

      if (!data.rows) {
        setChartData({ categories: [], series: [] });
        return;
      }

      const categories = data.rows.map(
        (row: { dimensionValues: { value: string }[] }) => row.dimensionValues[0]?.value
      );
      const series = data.rows.map(
        (row: { metricValues: { value: string }[] }) => Number(row.metricValues[0]?.value || 0)
      );

      setChartData({ categories, series });
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setChartData({ categories: [], series: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(startDate, endDate);
  }, [startDate, endDate]);

  const handleRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 310,
      toolbar: { show: false },
    },
    stroke: { curve: "straight", width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.55, opacityTo: 0 },
    },
    grid: {
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: chartData.categories,
      labels: { style: { fontSize: "12px", colors: "#6B7280" } },
    },
    yaxis: {
      labels: { style: { fontSize: "12px", colors: "#6B7280" } },
    },
    tooltip: { enabled: true },
    colors: ["#465FFF"],
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Visitors by Range
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Selecciona un rango de fechas para ver las visitas diarias
          </p>
        </div>

        <div className="flex items-start w-full gap-3 sm:justify-end">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleRangeChange}
          />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          {loading ? (
            <p className="text-center text-gray-500">Cargando datos...</p>
          ) : (
            <ReactApexChart
              options={options}
              series={[{ name: "Visitas", data: chartData.series }]}
              type="area"
              height={310}
            />
          )}
        </div>
      </div>
    </div>
  );
}
