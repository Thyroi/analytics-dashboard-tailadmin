"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { AreaChartSkeleton } from "@/components/skeletons";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ChartData = { categories: string[]; series: number[] };

const CHART_HEIGHT = 310;

export default function MonthlyRangeChart() {
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);

  const [startDate, setStartDate] = useState<Date>(lastMonth);
  const [endDate, setEndDate] = useState<Date>(today);
  const [chartData, setChartData] = useState<ChartData>({ categories: [], series: [] });
  const [loading, setLoading] = useState<boolean>(true);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const fetchData = async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics/monthly-range?start=${formatDate(start)}&end=${formatDate(end)}`
      );
      const data: {
        rows?: Array<{
          dimensionValues: { value: string }[];
          metricValues: { value: string }[];
        }>;
      } = await res.json();

      if (!data.rows) {
        setChartData({ categories: [], series: [] });
        return;
      }

      const categories = data.rows.map((row) => row.dimensionValues[0]?.value);
      const series = data.rows.map((row) => Number(row.metricValues[0]?.value || 0));
      setChartData({ categories, series });
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setChartData({ categories: [], series: [] });
    } finally {
      setTimeout(() => setLoading(false), 120); // anti-flash
    }
  };

  // Evita doble fetch en el mismo rango
  const lastRangeRef = useRef<string>("");
  useEffect(() => {
    const rangeKey = `${formatDate(startDate)}_${formatDate(endDate)}`;
    if (lastRangeRef.current === rangeKey) return;
    lastRangeRef.current = rangeKey;
    fetchData(startDate, endDate);
  }, [startDate, endDate]);

  const handleRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const rangeKey = useMemo(
    () => `${formatDate(startDate)}_${formatDate(endDate)}`,
    [startDate, endDate]
  );

  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "area",
        height: CHART_HEIGHT,
        toolbar: { show: false },
        animations: { enabled: !loading },
        redrawOnParentResize: false,
        parentHeightOffset: 0,
      },
      stroke: { curve: "straight", width: 2 },
      fill: { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } },
      grid: { yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
      dataLabels: { enabled: false },
      xaxis: {
        categories: chartData.categories,
        labels: { style: { fontSize: "12px", colors: "#6B7280" } },
      },
      yaxis: { labels: { style: { fontSize: "12px", colors: "#6B7280" } } },
      tooltip: { enabled: true },
      colors: ["#465FFF"],
    }),
    [loading, chartData.categories]
  );

  const hasData = chartData.categories.length > 0 && chartData.series.length > 0;

  // Skeleton simple
  if (loading) {
    // Asegúrate de que AreaChartSkeleton acepte solo { height?: number }
    return <AreaChartSkeleton height={CHART_HEIGHT} />;
  }

  return (
    <div className="card">
      {/* Header interno: título + date range picker */}
      <div className="card-header">
        <div>
          <h3 className="card-title">Visitas por rango</h3>
          <p className="card-subtitle">
            Selecciona un rango de fechas para ver las visitas diarias
          </p>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onRangeChange={handleRangeChange}
        />
      </div>

      {/* Body */}
      <div className="card-body">
        <div className="w-full overflow-hidden">
          {hasData ? (
            <ReactApexChart
              key={rangeKey}
              options={options}
              series={[{ name: "Visitas", data: chartData.series }]}
              type="area"
              height={CHART_HEIGHT}
            />
          ) : (
            <div style={{ height: CHART_HEIGHT }} />
          )}
        </div>
      </div>
    </div>
  );
}
