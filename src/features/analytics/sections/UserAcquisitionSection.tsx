"use client";

import { useState } from "react";
import LineChart from "@/components/charts/LineChart";
import DateRangePicker from "@/components/common/DateRangePicker";
import { AreaChartSkeleton } from "@/components/skeletons";
import { useUserAcquisitionRange } from "@/features/analytics/hooks/useUserAcquisitionRange";

const CHART_HEIGHT = 310;
const toISO = (d: Date) => d.toISOString().split("T")[0];

/** Si quieres colores fijos por nombre (opcional). Si no existe el nombre, usa palette por índice. */
const CHANNEL_COLORS: Record<string, string> = {
  Total: "#93C5FD",
  Direct: "#465FFF",
  Referral: "#22C55E",
  "Organic Search": "#F59E0B",
  "Organic Social": "#F163AA",
  "Paid Search": "#EF4444",
  Email: "#10B981",
  Display: "#A78BFA",
  "Organic Video": "#14B8A6",
  Unassigned: "#9CA3AF",
  Other: "#6B7280",
};

export default function UserAcquisitionSection() {
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);

  const [startDate, setStartDate] = useState<Date>(lastMonth);
  const [endDate, setEndDate] = useState<Date>(today);

  const { data, isLoading, error, hasData } = useUserAcquisitionRange({
    start: toISO(startDate),
    end: toISO(endDate),
    granularity: "d",
    includeTotal: true,
  });

  if (isLoading) return <AreaChartSkeleton height={CHART_HEIGHT} />;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">User Acquisition por canal</h3>
          <p className="card-subtitle">
            Usuarios (activeUsers) por día y canal (firstUserDefaultChannelGroup)
          </p>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onRangeChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
          }}
        />
      </div>

      <div className="card-body">
        {error ? (
          <div
            className="text-sm text-red-500 flex items-center justify-center"
            style={{ height: CHART_HEIGHT }}
          >
            {error.message}
          </div>
        ) : hasData && data ? (
          <LineChart
            categories={data.categoriesLabels}
            series={data.series}
            type="line" // o "area" si lo prefieres
            height={CHART_HEIGHT}
            colorsByName={CHANNEL_COLORS}
            showLegend
            legendPosition="bottom"
          />
        ) : (
          <div
            className="text-sm text-gray-400 flex items-center justify-center"
            style={{ height: CHART_HEIGHT }}
          >
            Sin datos en el rango
          </div>
        )}
      </div>
    </div>
  );
}
