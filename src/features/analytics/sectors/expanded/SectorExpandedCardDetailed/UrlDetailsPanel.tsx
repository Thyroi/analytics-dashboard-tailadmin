"use client";

import KPIList, { type KPIItem } from "@/components/charts/KPIList";
import Header from "@/components/common/Header";
import KPIListSkeleton from "@/components/skeletons/KPIListSkeleton";
import DonutSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DonutSection";
import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
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
  genders,
  countries,
  deltaPct,
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
        icon: <Users className="w-5 h-5" />, // Ícono de usuarios
      },
      {
        title: "Interacciones por sesión",
        value: nf2.format(c.eventsPerSession),
        delta: pf.format(d.eventsPerSession),
        deltaVariant: d.eventsPerSession < 0 ? "down" : "up",
        icon: <Activity className="w-5 h-5" />, // Ícono de actividad
      },
      {
        title: "Tiempo por usuario",
        value: formatDuration(c.avgEngagementPerUser),
        delta: pf.format(d.avgEngagementPerUser),
        deltaVariant: d.avgEngagementPerUser < 0 ? "down" : "up",
        icon: <Clock className="w-5 h-5" />, // Ícono de reloj
      },
      {
        title: "Tiempo medio de sesión",
        value: formatDuration(c.averageSessionDuration),
        delta: pf.format(d.averageSessionDuration),
        deltaVariant: d.averageSessionDuration < 0 ? "down" : "up",
        icon: <Timer className="w-5 h-5" />, // Ícono de temporizador
      },
    ];
  }, [kpis]);

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
    <div
      className="
        w-full p-6 rounded-lg shadow-sm border
        border-red-200/60
        bg-gradient-to-r from-white via-[#fef2f2] to-[#fff7ed]
      "
    >
      {/* Encabezado general */}
      <div className="mb-4 flex items-start justify-between gap-3 pb-3 border-b border-red-200/60">
        <Header
          title="Detalle de URL"
          titleSize="sm"
          Icon={Activity}
          subtitle={subtitleText}
          subtitleColor="text-red-600"
        />
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

      {/* Sección 1: KPIs */}
      <section className="mb-6">
        <DrilldownTitle name="indicadores clave" color="dark" />
        <div className="mt-3">
          {!items ? (
            <KPIListSkeleton stretch />
          ) : (
            <KPIList
              items={items}
              direction="horizontal"
              /* itemsPerPage no se pasa => WRAP en 2 columnas */
              className="w-full"
            />
          )}
        </div>
      </section>

      {/* Sección 2: Gráfica de engagement */}
      <section className="mb-6">
        <DrilldownTitle name="engagement promedio (s)" color="primary" />
        <div className="mt-3">
          <ChartSection
            categories={categories}
            currData={currData}
            prevData={prevData}
          />
        </div>
      </section>

      {/* Sección 3: Donuts */}
      <section>
        <DrilldownTitle name="tecnológia y demográfia" color="secondary" />
        <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-3">
          <DonutSection
            donutData={operatingSystems}
            title="SISTEMAS OPERATIVOS"
            titleColor="text-[#c10007]"
          />

          <DonutSection
            donutData={genders}
            title="GÉNERO DE USUARIOS"
            titleColor="text-[#c10007]"
          />

          <DonutSection
            donutData={countries}
            title="PAÍS DE ORIGEN"
            titleColor="text-[#c10007]"
          />
        </div>
      </section>
    </div>
  );
}
