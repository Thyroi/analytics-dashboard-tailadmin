"use client";

import KPIStatGrid from "@/components/dashboard/KPIStatGrid";
import { useHeaderAnalyticsTimeframe } from "@/features/analytics/context/HeaderAnalyticsTimeContext";
import { useKpis } from "@/features/analytics/hooks/useKpis";
import { Bolt, Clock, Eye, MousePointer2, Users } from "lucide-react";
import { useMemo } from "react";

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

type MetricItem = {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color?: string;
  delay?: number;
};

export default function AnalyticsKPISection({
  className = "",
}: {
  className?: string;
}) {
  const { mode, granularity, startISO, endISO } = useHeaderAnalyticsTimeframe();

  const fetchParams = useMemo(
    () => ({
      start: mode === "range" ? startISO : undefined,
      end: mode === "range" ? endISO : undefined,
      granularity,
    }),
    [mode, startISO, endISO, granularity]
  );

  const { data, isLoading, error } = useKpis(fetchParams);

  const items: MetricItem[] | null = useMemo(() => {
    if (!data) return null;
    console.log("🔍 KPI Data:", {
      current: data.current,
      previous: data.previous,
      deltaPct: data.deltaPct,
    });
    const { current, deltaPct } = data;

    const d = (x?: number | null): number | undefined =>
      x == null ? undefined : Number((x * 100).toFixed(1));

    return [
      {
        title: "Usuarios activos",
        value: current.activeUsers,
        change: d(deltaPct.activeUsers ?? undefined),
        icon: Users,
        color: "from-orange-500 to-red-500",
        delay: 0.1,
      },
      {
        title: "Sesiones con interacción",
        value: current.engagedSessions,
        change: d(deltaPct.engagedSessions ?? undefined),
        icon: MousePointer2,
        color: "from-red-500 to-pink-500",
        delay: 0.2,
      },
      {
        title: "Eventos",
        value: current.eventCount,
        change: d(deltaPct.eventCount ?? undefined),
        icon: Bolt,
        color: "from-amber-500 to-orange-500",
        delay: 0.3,
      },
      {
        title: "Vistas de página",
        value: current.screenPageViews,
        change: d(deltaPct.screenPageViews ?? undefined),
        icon: Eye,
        color: "from-yellow-500 to-red-500",
        delay: 0.4,
      },
      {
        title: "Tiempo medio de sesión",
        value: formatDuration(current.averageSessionDuration),
        change: d(deltaPct.averageSessionDuration ?? undefined),
        icon: Clock,
        color: "from-orange-600 to-red-600",
        delay: 0.5,
      },
    ];
  }, [data]);

  if (isLoading || !items) {
    return (
      <div
        className={`grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(221px,1fr))] ${className}`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 ${className}`}
      >
        Error cargando KPIs: {error.message}
      </div>
    );
  }

  return (
    <KPIStatGrid
      className={className}
      items={items}
      colsClassName="[grid-template-columns:repeat(auto-fit,minmax(221px,1fr))]"
    />
  );
}
