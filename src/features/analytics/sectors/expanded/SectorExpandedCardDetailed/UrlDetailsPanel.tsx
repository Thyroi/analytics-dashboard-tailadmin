"use client";

import KPIList, { type KPIItem } from "@/components/charts/KPIList";
import KPIListSkeleton from "@/components/skeletons/KPIListSkeleton";
import DonutSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DonutSection";
import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useMemo } from "react";

const pf = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 1,
});
const nf2 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

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
  path: string;
  loading: boolean;
  seriesAvgEngagement: { current: SeriesPoint[]; previous: SeriesPoint[] };
  kpis: {
    current: {
      activeUsers: number;
      userEngagementDuration: number;
      newUsers: number;
      eventCount: number;
      sessions: number;
      averageSessionDuration: number;
      avgEngagementPerUser: number;
      eventsPerSession: number;
    };
    previous: {
      activeUsers: number;
      userEngagementDuration: number;
      newUsers: number;
      eventCount: number;
      sessions: number;
      averageSessionDuration: number;
      avgEngagementPerUser: number;
      eventsPerSession: number;
    };
    deltaPct: {
      activeUsers: number;
      newUsers: number;
      eventCount: number;
      sessions: number;
      averageSessionDuration: number;
      avgEngagementPerUser: number;
      eventsPerSession: number;
    };
  } | null;
  operatingSystems: DonutDatum[];
  genders: DonutDatum[];
  countries: DonutDatum[];
  deltaPct: number;
  granularity: Granularity;
  endISO?: string;
  onClose?: () => void;
};

export default function UrlDetailsPanel({
  path,
  loading,
  seriesAvgEngagement,
  kpis,
  operatingSystems,
  genders,
  countries,
  deltaPct,
  onClose,
}: Props) {
  // KPIs left column (por URL)
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
      },
      {
        title: "Interacciones por sesión",
        value: nf2.format(c.eventsPerSession),
        delta: pf.format(d.eventsPerSession),
        deltaVariant: d.eventsPerSession < 0 ? "down" : "up",
      },
      {
        title: "Tiempo por usuario",
        value: formatDuration(c.avgEngagementPerUser),
        delta: pf.format(d.avgEngagementPerUser),
        deltaVariant: d.avgEngagementPerUser < 0 ? "down" : "up",
      },
      {
        title: "Tiempo medio de sesión",
        value: formatDuration(c.averageSessionDuration),
        delta: pf.format(d.averageSessionDuration),
        deltaVariant: d.averageSessionDuration < 0 ? "down" : "up",
      },
    ];
  }, [kpis]);

  // data for line chart (engagement promedio por bucket)
  const { categories, currData, prevData } = useMemo(() => {
    const n = Math.min(
      seriesAvgEngagement.current.length,
      seriesAvgEngagement.previous.length
    );
    const cur = seriesAvgEngagement.current.slice(-n);
    const prev = seriesAvgEngagement.previous.slice(-n);
    return {
      categories: cur.map((p) => p.label),
      currData: cur.map((p) => p.value),
      prevData: prev.map((p) => p.value),
    };
  }, [seriesAvgEngagement]);

  return (
    <div className="w-full">
      {/* Header minimal */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            Detalle de URL
          </h4>
          <p
            title={path}
            className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate"
          >
            {path}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
          >
            Cerrar
          </button>
        )}
      </div>

      {/* KPIs (izquierda) + line chart (derecha) */}
      <div
        className="mb-6 grid gap-6 items-start"
        style={{ gridTemplateColumns: "260px 1fr" }}
      >
        <div>
          {!items ? (
            <KPIListSkeleton stretch />
          ) : (
            <KPIList items={items} stretch />
          )}
        </div>
        <div>
          <div className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
            Engagement promedio (s)
          </div>
          <ChartSection
            categories={categories}
            currData={currData}
            prevData={prevData}
          />
        </div>
      </div>

      {/* Donuts: SO / Género / País (sin cajas, solo títulos) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
            Sistemas Operativos
          </div>
          <DonutSection donutData={operatingSystems} deltaPct={deltaPct} />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
            Género
          </div>
          <DonutSection donutData={genders} deltaPct={deltaPct} />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
            País
          </div>
          <DonutSection donutData={countries} deltaPct={deltaPct} />
        </div>
      </div>
    </div>
  );
}
