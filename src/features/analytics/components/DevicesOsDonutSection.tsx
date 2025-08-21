"use client";

import PieChart, { type PieDatum } from "@/components/charts/PieChart";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";
import { fetchDevicesOs } from "@/features/analytics/services/devicesOs";
import { useEffect, useMemo, useState } from "react";

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
  const [labels, setLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchDevicesOs();
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

  const data: PieDatum[] = useMemo(
    () => labels.map((label, i) => ({ label, value: values[i] ?? 0 })),
    [labels, values]
  );

  if (loading) return <ChartSkeleton height={CHART_HEIGHT} />;

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="card-title">Usuarios por sistema operativo</h3>
      </div>

      <div className="card-body">
        {data.length > 0 ? (
          <PieChart
            type="donut"                 // usamos el componente genérico en modo donut
            data={data}
            height={CHART_HEIGHT}
            colorsByLabel={OS_COLORS}    // mapa de colores por etiqueta
            dataLabels="percent"
            donutTotalLabel="Total"
            legendPosition="bottom"
            showLegend
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
