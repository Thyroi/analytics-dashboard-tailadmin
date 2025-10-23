// src/features/analytics/sectors/expanded/SectorExpandedCardDetailed/UrlDetailsPanel.tsx
"use client";

import KPIList, { type KPIItem } from "@/components/charts/KPIList";
import Header from "@/components/common/Header";
import KPIListSkeleton from "@/components/skeletons/KPIListSkeleton";
import DonutSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DonutSection";
import { UrlDetailsPanelSkeleton } from "@/features/analytics/skeletons";
import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { formatChartLabelsSimple } from "@/lib/utils/charts/labelFormatting";
import { Activity, Clock, Timer, Users } from "lucide-react";
import { useMemo } from "react";
import DrilldownTitle from "./DrilldownTitle";

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

function humanize(s: string): string {
  const cleaned = s.replace(/[-_]+/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
function deriveActivityFromPath(path: string): string | null {
  if (!path) return null;
  try {
    const decoded = decodeURIComponent(path);
    const parts = decoded.split("/").filter(Boolean);
    const last = parts[parts.length - 1] ?? "";
    if (!last) return null;
    return humanize(last);
  } catch {
    return null;
  }
}

type KpisBlock = {
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

type Props = {
  path: string;
  loading: boolean;
  /** El service puede devolverla vacía mientras carga → la hacemos opcional y saneamos */
  seriesAvgEngagement?: { current: SeriesPoint[]; previous: SeriesPoint[] };
  kpis: KpisBlock;
  operatingSystems: DonutDatum[];
  devices: DonutDatum[];
  countries: DonutDatum[];
  deltaPct: number;
  granularity: Granularity;
  endISO?: string;
  onClose?: () => void;
  activityName?: string;
  contextName?: string;
  contextKind?: "category" | "town";
};

export default function UrlDetailsPanel({
  path,
  loading,
  seriesAvgEngagement,
  kpis,
  operatingSystems,
  devices,
  countries,
  deltaPct,
  granularity,
  onClose,
  activityName,
  contextName,
}: Props) {
  const subtitleText = useMemo(() => {
    const activity = activityName ?? deriveActivityFromPath(path);
    if (activity && contextName) {
      return `Análisis específico de la actividad ${activity} de ${contextName}`;
    }
    if (activity) {
      return `Análisis específico de la actividad ${activity}`;
    }
    return "Análisis específico del ámbito";
  }, [activityName, contextName, path]);

  // === KPIs → KPIList
  const items: KPIItem[] | null = useMemo(() => {
    if (!kpis) return null;
    const c = kpis.current;
    const d = kpis.deltaPct;
    return [
      {
        title: "Usuarios",
        value: String(c.activeUsers),
        delta: pf.format(d.activeUsers),
        deltaVariant: d.activeUsers < 0 ? "down" : "up",
        icon: <Users className="w-5 h-5" />,
      },
      {
        title: "Interacciones por sesión",
        value: nf2.format(c.eventsPerSession),
        delta: pf.format(d.eventsPerSession),
        deltaVariant: d.eventsPerSession < 0 ? "down" : "up",
        icon: <Activity className="w-5 h-5" />,
      },
      {
        title: "Tiempo por usuario",
        value: formatDuration(c.avgEngagementPerUser),
        delta: pf.format(d.avgEngagementPerUser),
        deltaVariant: d.avgEngagementPerUser < 0 ? "down" : "up",
        icon: <Clock className="w-5 h-5" />,
      },
      {
        title: "Tiempo medio de sesión",
        value: formatDuration(c.averageSessionDuration),
        delta: pf.format(d.averageSessionDuration),
        deltaVariant: d.averageSessionDuration < 0 ? "down" : "up",
        icon: <Timer className="w-5 h-5" />,
      },
    ];
  }, [kpis]);

  // === Serie de engagement promedio (seg) — tolerante a undefined
  const { categories, currData, prevData } = useMemo(() => {
    const safeSeries: { current: SeriesPoint[]; previous: SeriesPoint[] } = {
      current: seriesAvgEngagement?.current ?? [],
      previous: seriesAvgEngagement?.previous ?? [],
    };

    const n = Math.min(safeSeries.current.length, safeSeries.previous.length);
    const cur = safeSeries.current.slice(-n);
    const prev = safeSeries.previous.slice(-n);
    const rawCategories = cur.map((p) => p.label);
    return {
      categories: formatChartLabelsSimple(rawCategories, granularity),
      currData: cur.map((p) => p.value),
      prevData: prev.map((p) => p.value),
    };
  }, [seriesAvgEngagement, granularity]);

  if (loading) {
    return <UrlDetailsPanelSkeleton chartHeight={260} />;
  }

  return (
    <div
      className="
        w-full p-6 rounded-lg shadow-sm border transition-all duration-200
        border-red-200/60 dark:border-red-700/40
        bg-gradient-to-r from-white via-[#fef2f2] to-[#fff7ed]
        dark:from-gray-800 dark:via-gray-800/95 dark:to-gray-800/90
        ring-1 ring-black/5 dark:ring-white/10
      "
    >
      {/* Encabezado */}
      <div className="mb-4 flex items-start justify-between gap-3 pb-3 border-b border-red-200/60 dark:border-red-700/40">
        <Header
          title="Detalle de URL"
          titleSize="sm"
          Icon={Activity}
          subtitle={subtitleText}
          subtitleColor="text-red-600 dark:text-red-400"
        />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
        )}
      </div>

      {/* KPIs */}
      <section className="mb-6">
        <DrilldownTitle name="indicadores clave" color="dark" />
        <div className="mt-3">
          {!items ? (
            <KPIListSkeleton stretch />
          ) : (
            <KPIList items={items} direction="horizontal" className="w-full" />
          )}
        </div>
      </section>

      {/* Engagement promedio */}
      <section className="mb-6">
        <DrilldownTitle name="engagement promedio (s)" color="primary" />
        <div className="mt-3 h-[450px]">
          <ChartSection
            categories={categories}
            currData={currData}
            prevData={prevData}
          />
          {categories.length === 0 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Sin datos suficientes para la granularidad &quot;{granularity}
              &quot;.
            </div>
          )}
        </div>
      </section>

      {/* Donuts */}
      <section>
        <DrilldownTitle name="tecnológia y demográfia" color="secondary" />
        <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-3">
          <DonutSection
            donutData={operatingSystems ?? []}
            title="SISTEMAS OPERATIVOS"
            titleColor="text-[#c10007]"
          />
          <DonutSection
            donutData={devices ?? []}
            title="TIPO DE DISPOSITIVO"
            titleColor="text-[#c10007]"
          />
          <DonutSection
            donutData={countries ?? []}
            title="PAÍS DE ORIGEN"
            titleColor="text-[#c10007]"
          />
        </div>
      </section>

      {/* Delta global (sobre vistas) */}
      <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
        Variación total (vistas):{" "}
        <span className="font-semibold">{Math.round(deltaPct)}%</span>
      </div>
    </div>
  );
}
