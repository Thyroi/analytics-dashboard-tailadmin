"use client";

import LineChart from "@/components/charts/LineChart";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";
import { fetchUserActivity } from "@/features/analytics/services/userActivity";
import type { MultiSeriesCategoriesPayload } from "@/features/analytics/types";
import { useEffect, useState } from "react";

const CHART_HEIGHT = 260;

const COLORS = {
  "30 días": "#465FFF", // azul
  "7 días": "#22C55E", // verde
  "1 día": "#F59E0B", // naranja
} as const;

export default function UserActivityComparisonSection() {
  const [data, setData] = useState<MultiSeriesCategoriesPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const resp = await fetchUserActivity(); // rango por defecto ~45 días
        if (!cancelled) setData(resp);
      } catch (e) {
        console.error("UserActivityComparisonSection:", e);
        if (!cancelled) setData({ categories: [], series: [] });
      } finally {
        if (!cancelled) setTimeout(() => setLoading(false), 120);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <ChartSkeleton height={CHART_HEIGHT} />;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            Actividad de los usuarios a lo largo del tiempo
          </h3>
          <p className="card-subtitle">1 / 7 / 30 días (DAU / WAU / MAU)</p>
        </div>
      </div>
      <div className="card-body">
        {data && data.series.length > 0 ? (
          <LineChart
            categories={data.categories}
            series={data.series}
            height={CHART_HEIGHT}
            smooth
            showLegend
            colorsByName={COLORS}
          />
        ) : (
          <div style={{ height: CHART_HEIGHT }} />
        )}
      </div>
    </div>
  );
}
