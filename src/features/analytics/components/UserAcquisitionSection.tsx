"use client";

import LineChart from "@/components/charts/LineChart";
import DateRangePicker from "@/components/common/DateRangePicker";
import { AreaChartSkeleton } from "@/components/skeletons";
import { fetchUserAcquisitionRange } from "@/features/analytics/services/userAcquisitionRange";
import type { AcquisitionRangePayload } from "@/features/analytics/types";
import { useEffect, useRef, useState } from "react";

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
  const [data, setData] = useState<AcquisitionRangePayload | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(start: Date, end: Date): Promise<void> {
    setLoading(true);
    try {
      const resp = await fetchUserAcquisitionRange({
        start: toISO(start),
        end: toISO(end),
      });

      setData(resp);
    } catch (e) {
      console.error("UserAcquisitionSection:", e);
      setData(null);
    } finally {
      setTimeout(() => setLoading(false), 120);
    }
  }

  const lastKeyRef = useRef<string>("");
  useEffect(() => {
    const key = `${toISO(startDate)}_${toISO(endDate)}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    void load(startDate, endDate);
  }, [startDate, endDate]);

  const hasData =
    data &&
    data.series.length > 0 &&
    data.series.some((s) => s.data.some((v) => v > 0));

  if (loading) return <AreaChartSkeleton height={CHART_HEIGHT} />;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">User Acquisition por canal</h3>
          <p className="card-subtitle">
            Usuarios (activeUsers) por día y canal
            (firstUserDefaultChannelGroup)
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
        {hasData && data ? (
          <LineChart
            categories={data.categoriesLabels}
            series={data.series}
            type="line" // o "area" si lo prefieres
            height={CHART_HEIGHT}
            colorsByName={CHANNEL_COLORS} // mapea por nombre cuando coincida
            // palette={["#465FFF", "#22C55E", "#F59E0B", "#F163AA", "#EF4444", "#10B981"]} // opcional: override
            showLegend
            legendPosition="bottom"
          />
        ) : (
          <div style={{ height: CHART_HEIGHT }} />
        )}
      </div>
    </div>
  );
}
