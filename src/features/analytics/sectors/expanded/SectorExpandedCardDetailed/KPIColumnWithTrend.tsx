"use client";

import React, { useMemo } from "react";
import type { SeriesPoint } from "@/lib/types";
import KPIList, { type KPIItem } from "@/components/charts/KPIList";
import KPIListSkeleton from "@/components/skeletons/KPIListSkeleton";
import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";
import { Clock, UserPlus, MousePointer2, Timer } from "lucide-react";

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

type KPIsForUrl = {
  current: {
    newUsers: number;
    eventsPerSession: number;
    avgEngagementPerUser: number;      // seconds/user
    averageSessionDuration: number;    // seconds
  };
  deltaPct: {
    newUsers: number;
    eventsPerSession: number;
    avgEngagementPerUser: number;
    averageSessionDuration: number;
  };
};

type Props = {
  /** Serie a graficar (líneas) */
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  /** KPIs ya calculados (por URL) */
  kpis: KPIsForUrl | null;
  /** Cargando (para skeleton) */
  loading?: boolean;
  /** Error opcional (para mostrar mensaje sencillo) */
  error?: string | null;
  /** Título encima del gráfico */
  title?: string;
  className?: string;
};

/** KPIs en columna a la izquierda + line chart a la derecha (sin hooks) */
export default function KPIColumnWithTrend({
  series,
  kpis,
  loading = false,
  error = null,
  title = "Tendencia",
  className = "",
}: Props) {
  const items: KPIItem[] | null = useMemo(() => {
    if (!kpis) return null;
    const c = kpis.current;
    const d = kpis.deltaPct;
    return [
      {
        title: "Usuarios nuevos",
        value: String(c.newUsers),
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
  }, [kpis]);

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
        {loading || !items ? (
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
        <ChartSection categories={categories} currData={currData} prevData={prevData} />
      </div>
    </div>
  );
}
