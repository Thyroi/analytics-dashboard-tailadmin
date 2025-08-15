"use client";

import DonutChart from "@/components/charts/DonutChart";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";
import { fetchDevicesOs } from "@/features/analytics/services/devicesOs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const CHART_HEIGHT = 260;

// Colores “de marca” por SO; fallback gris para otros
const OS_COLORS: Record<string, string> = {
  Windows: "#00A4EF",
  Android: "#3DDC84",
  iOS: "#A3AAAE",
  Macintosh: "#6E6E73",
  Linux: "#F4C20D",
  "Chrome OS": "#5BB974",
  Other: "#9CA3AF",
};

export default function DevicesOsDonutSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [labels, setLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchDevicesOs(); // último ~30 días por default (server)
        if (!cancelled) {
          setLabels(data.labels);
          setValues(data.values);
        }
      } catch (e) {
        console.error("DevicesOsDonutSection:", e);
        if (!cancelled) {
          setLabels([]);
          setValues([]);
        }
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
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="card-title">Usuarios por sistema operativo</h3>
      </div>

      <div className="card-body">
        {values.length > 0 ? (
          <DonutChart
            labels={labels}
            values={values}
            height={CHART_HEIGHT}
            colorsByName={OS_COLORS}
            tooltipTheme={isDark ? "dark" : "light"}
            showTotal
            totalLabel="Total"
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
