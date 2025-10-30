import type { KPIItem } from "@/components/charts/KPIList";
import { Clock, MousePointer2, Timer, UserPlus } from "lucide-react";
import { useMemo } from "react";
import type { KPIsForUrl } from "./types";
import { PERCENT_FORMATTER, DECIMAL_FORMATTER } from "./constants";
import { formatDuration } from "./utils";

export function useKPIItems(kpis: KPIsForUrl | null): KPIItem[] | null {
  return useMemo(() => {
    if (!kpis) return null;
    const c = kpis.current;
    const d = kpis.deltaPct;
    return [
      {
        title: "Usuarios nuevos",
        value: String(c.newUsers),
        delta: PERCENT_FORMATTER.format(d.newUsers),
        deltaVariant: d.newUsers < 0 ? "down" : "up",
        icon: <UserPlus className="h-4 w-4" />,
      },
      {
        title: "Interacciones por sesión",
        value: DECIMAL_FORMATTER.format(c.eventsPerSession),
        delta: PERCENT_FORMATTER.format(d.eventsPerSession),
        deltaVariant: d.eventsPerSession < 0 ? "down" : "up",
        icon: <MousePointer2 className="h-4 w-4" />,
      },
      {
        title: "Tiempo por usuario",
        value: formatDuration(c.avgEngagementPerUser),
        delta: PERCENT_FORMATTER.format(d.avgEngagementPerUser),
        deltaVariant: d.avgEngagementPerUser < 0 ? "down" : "up",
        icon: <Timer className="h-4 w-4" />,
      },
      {
        title: "Tiempo medio de sesión",
        value: formatDuration(c.averageSessionDuration),
        delta: PERCENT_FORMATTER.format(d.averageSessionDuration),
        deltaVariant: d.averageSessionDuration < 0 ? "down" : "up",
        icon: <Clock className="h-4 w-4" />,
      },
    ];
  }, [kpis]);
}
