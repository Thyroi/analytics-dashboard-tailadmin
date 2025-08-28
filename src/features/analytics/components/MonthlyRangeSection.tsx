"use client";

import LineChart from "@/components/charts/LineChart";
import DateRangePicker from "@/components/common/DateRangePicker";
import { AreaChartSkeleton } from "@/components/skeletons";
import { fetchMonthlyRange } from "@/features/analytics/services/monthlyRange";
import type { SingleMetricRangePayload } from "@/features/analytics/types";
import { useEffect, useRef, useState } from "react";

const CHART_HEIGHT = 310;
const toISO = (d: Date) => d.toISOString().split("T")[0];

export default function MonthlyRangeSection() {
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);

  const [startDate, setStartDate] = useState<Date>(lastMonth);
  const [endDate, setEndDate] = useState<Date>(today);
  const [data, setData] = useState<SingleMetricRangePayload | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(start: Date, end: Date): Promise<void> {
    setLoading(true);
    try {
      const resp = await fetchMonthlyRange({
        start: toISO(start),
        end: toISO(end),
      });
      setData(resp);
    } catch (e) {
      console.error("MonthlyRangeSection:", e);
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

  const hasData = !!data && data.series.data.length > 0;

  if (loading) return <AreaChartSkeleton height={CHART_HEIGHT} />;

  return (
    <div className="card">
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
            series={[data.series]} // una sola serie
            type="area" // área (gradiente)
            height={CHART_HEIGHT}
            colorsByName={{ Visitas: "#465FFF" }} // color fijo para la serie
            showLegend={false}
          />
        ) : (
          <div style={{ height: CHART_HEIGHT }} />
        )}
      </div>
    </div>
  );
}
