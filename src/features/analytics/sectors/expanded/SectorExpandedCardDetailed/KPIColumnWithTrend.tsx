"use client";

import React, { useMemo } from "react";
import type { Granularity, SeriesPoint } from "@/lib/types";
import KPIList, { type KPIItem } from "@/components/charts/KPIList";
import KPIListSkeleton from "@/components/skeletons/KPIListSkeleton";
import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";
import { useKpisEnhanced } from "@/features/analytics/hooks/useKpisEnhanced";
import { Clock, UserPlus, MousePointer2, Timer } from "lucide-react";

const nf = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
const pf = new Intl.NumberFormat("es-ES", { style: "percent", maximumFractionDigits: 1 });
const df = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

type Props = {
  granularity: Granularity;
  endISO?: string;
  // Datos del gráfico (ya los tienes en el panel que integra este componente)
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  title?: string;
  className?: string;
};

/** Columna de KPIs a la izquierda + gráfico de líneas a la derecha */
export default function KPIColumnWithTrend({
  granularity,
  endISO,
  series,
  title = "Tendencia",
  className = "",
}: Props) {
  const { data, isLoading, error } = useKpisEnhanced({ granularity, endISO });

  const items: KPIItem[] | null = useMemo(() => {
    if (!data) return null;
    const c = data.current;
    const d = data.deltaPct;
    return [
      {
        title: "Usuarios nuevos",
        value: nf.format(c.newUsers),
        delta: pf.format(d.newUsers),
        deltaVariant: d.newUsers < 0 ? "down" : "up",
        icon: <UserPlus className="h-4 w-4" />,
      },
      {
        title: "Interacciones por sesión",
        value: df.format(c.eventsPerSession),
        delta: pf.format(d.eventsPerSession),
        deltaVariant: d.eventsPerSession < 0 ? "down" : "up",
        icon: <MousePointer2 className="h-4 w-4" />,
      },
      {
        title: "Tiempo por usuario",
        value: formatDuration(c.avgEngagementPerUser),
        delta: pf.format(d.avgEngagementPerUser),
        deltaVariant: d.avgEngagementPerUser < 0 ? "down" : "up",
        icon: <Timer className="h-4 w-4" />,
      },
      {
        title: "Tiempo medio de sesión",
        value: formatDuration(c.averageSessionDuration),
        delta: pf.format(d.averageSessionDuration),
        deltaVariant: d.averageSessionDuration < 0 ? "down" : "up",
        icon: <Clock className="h-4 w-4" />,
      },
    ];
  }, [data]);

  const { categories, currData, prevData } = useMemo(() => {
    const n = Math.min(series.current.length, series.previous.length);
    const cur = series.current.slice(-n);
    const prev = series.previous.slice(-n);
    return {
      categories: cur.map((p) => p.label),
      currData: cur.map((p) => p.value),
      prevData: prev.map((p) => p.value),
    };
  }, [series]);

  return (
    <div
      className={`grid gap-6 items-start ${className}`}
      style={{ gridTemplateColumns: "260px 1fr" }}
    >
      {/* Columna izquierda: KPIs en vertical */}
      <div>
        {isLoading || !items ? (
          <KPIListSkeleton stretch />
        ) : error ? (
          <div className="text-sm text-red-500">Error cargando KPIs: {error}</div>
        ) : (
          <KPIList items={items} stretch />
        )}
      </div>

      {/* Columna derecha: gráfico de líneas (sin cajas extras) */}
      <div>
        <div className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
          {title}
        </div>
        <ChartSection
          categories={categories}
          currData={currData}
          prevData={prevData}
        />
      </div>
    </div>
  );
}
