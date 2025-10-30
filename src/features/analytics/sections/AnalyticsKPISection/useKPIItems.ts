import { useMemo } from "react";
import { useKpis } from "@/features/analytics/hooks/useKpis";
import { Bolt, Clock, Eye, MousePointer2, Users } from "lucide-react";
import type { MetricItem } from "./types";
import { formatDuration } from "./utils";
import type { Granularity } from "@/lib/types";

interface UseKPIItemsParams {
  mode: string;
  startISO: string | undefined;
  endISO: string | undefined;
  granularity: Granularity;
}

export function useKPIItems({ mode, startISO, endISO, granularity }: UseKPIItemsParams) {
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

  return { items, isLoading, error };
}
