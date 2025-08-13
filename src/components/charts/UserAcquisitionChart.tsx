"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { AreaChartSkeleton } from "@/components/skeletons";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Series = { name: string; data: number[] };
type ApiSuccess = {
  categoriesISO: string[];
  categoriesLabels: string[];
  channels: string[];
  series: Series[];
  totalSeries: Series;
};
type ApiError = { error: string };

function isApiError(x: unknown): x is ApiError {
  return typeof x === "object" && x !== null && "error" in x;
}

const CHART_HEIGHT = 310;

const channelColors: Record<string, string> = {
  Total: "#93C5FD",
  Direct: "#465FFF", 
  Referral: "#22C55E",
  "Organic Search": "#F59E0B",
  "Organic Social": "#f163aaff",
  "Paid Search": "#EF4444",
  Email: "#10B981",
  Display: "#A78BFA",
  "Organic Video": "#14B8A6",
  Unassigned: "#9CA3AF",
  Other: "#6B7280",
};

export default function UserAcquisitionChart() {
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);

  const [startDate, setStartDate] = useState<Date>(lastMonth);
  const [endDate, setEndDate] = useState<Date>(today);
  const [resp, setResp] = useState<ApiSuccess | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  async function fetchData(start: Date, end: Date): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics/user-acquisition-range?start=${formatDate(start)}&end=${formatDate(end)}`
      );
      const json: unknown = await res.json();
      if (isApiError(json)) throw new Error(json.error);
      setResp(json as ApiSuccess);
    } catch (e) {
      console.error("Error fetching acquisition chart:", e);
      setResp(null);
    } finally {
      setTimeout(() => setLoading(false), 120);
    }
  }

  const lastRangeRef = useRef<string>("");
  useEffect(() => {
    const key = `${formatDate(startDate)}_${formatDate(endDate)}`;
    if (lastRangeRef.current === key) return;
    lastRangeRef.current = key;
    void fetchData(startDate, endDate);
  }, [startDate, endDate]);

  const handleRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const rangeKey = useMemo(
    () => `${formatDate(startDate)}_${formatDate(endDate)}`,
    [startDate, endDate]
  );

  const options: ApexOptions = useMemo(() => {
    const categories = resp?.categoriesLabels ?? [];
    const names = resp?.series.map((s) => s.name) ?? [];
    const colors = names.map((n) => channelColors[n] ?? "#465FFF");

    return {
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "line", // si quieres área, cambia a "area"
        height: CHART_HEIGHT,
        toolbar: { show: false },
        animations: { enabled: !loading },
        redrawOnParentResize: false,
        parentHeightOffset: 0,
      },
      stroke: { curve: "straight", width: 2 },
      grid: { yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
      dataLabels: { enabled: false },
      xaxis: { categories, labels: { style: { fontSize: "12px", colors: "#6B7280" } } },
      yaxis: { labels: { style: { fontSize: "12px", colors: "#6B7280" } } },
      tooltip: { enabled: true, shared: true },
      legend: { position: "bottom" },
      colors,
    };
  }, [loading, resp?.categoriesLabels, resp?.series]);

  const hasData =
    resp !== null && resp.series.length > 0 && resp.series.some((s) => s.data.some((v) => v > 0));

  if (loading) return <AreaChartSkeleton height={CHART_HEIGHT} />;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">User Acquisition por canal</h3>
          <p className="card-subtitle">
            Usuarios (activeUsers) por día y canal (firstUserDefaultChannelGroup)
          </p>
        </div>
        <DateRangePicker startDate={startDate} endDate={endDate} onRangeChange={handleRangeChange} />
      </div>

      <div className="card-body">
        <div className="w-full overflow-hidden">
          {hasData && resp ? (
            <ReactApexChart
              key={rangeKey}
              options={options}
              series={resp.series}
              type="line"
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
