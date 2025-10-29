"use client";

import type { KPIItem } from "@/components/charts/KPIList";
import { Activity, Clock, Timer, Users } from "lucide-react";
import { useMemo } from "react";
import { formatDuration } from "./formatters";
import type { KpisBlock } from "./types";

const pf = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 1,
});

const nf2 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

export function useUrlKPIs(kpis: KpisBlock): KPIItem[] | null {
  return useMemo(() => {
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
}
