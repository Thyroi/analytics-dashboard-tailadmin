"use client";

import KPIList, { type KPIItem } from "@/components/charts/KPIList";
import KPIListSkeleton from "@/components/skeletons/KPIListSkeleton";
import { useKpis } from "@/features/analytics/hooks/useKpis";
import { Bolt, Clock, Eye, MousePointer2, Users } from "lucide-react";
import { useMemo, useState } from "react";

const nf = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
const pf = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 1,
});
const toISO = (d: Date) => d.toISOString().split("T")[0];

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export default function AnalyticsKPISection({
  className = "",
  stretch = true,
}: {
  className?: string;
  /** Si true, cada tarjeta ocupa 1/N del alto del contenedor */
  stretch?: boolean;
}) {
  // Rango por defecto (último mes)
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);

  const [startDate] = useState<Date>(lastMonth);
  const [endDate] = useState<Date>(today);

  const { data, isLoading, error } = useKpis({
    start: toISO(startDate),
    end: toISO(endDate),
    granularity: "d",
  });

  const items: KPIItem[] | null = useMemo(() => {
    if (!data) return null;
    const { current, deltaPct } = data;
    return [
      {
        title: "Usuarios activos",
        value: nf.format(current.activeUsers),
        delta:
          deltaPct.activeUsers == null ? "—" : pf.format(deltaPct.activeUsers),
        deltaVariant:
          deltaPct.activeUsers != null && deltaPct.activeUsers < 0
            ? "down"
            : "up",
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: "Sesiones con interacción",
        value: nf.format(current.engagedSessions),
        delta:
          deltaPct.engagedSessions == null
            ? "—"
            : pf.format(deltaPct.engagedSessions),
        deltaVariant:
          deltaPct.engagedSessions != null && deltaPct.engagedSessions < 0
            ? "down"
            : "up",
        icon: <MousePointer2 className="h-4 w-4" />,
      },
      {
        title: "Eventos",
        value: nf.format(current.eventCount),
        delta:
          deltaPct.eventCount == null ? "—" : pf.format(deltaPct.eventCount),
        deltaVariant:
          deltaPct.eventCount != null && deltaPct.eventCount < 0
            ? "down"
            : "up",
        icon: <Bolt className="h-4 w-4" />,
      },
      {
        title: "Vistas (page/screen)",
        value: nf.format(current.screenPageViews),
        delta:
          deltaPct.screenPageViews == null
            ? "—" 
            : pf.format(deltaPct.screenPageViews),
        deltaVariant:
          deltaPct.screenPageViews != null && deltaPct.screenPageViews < 0
            ? "down"
            : "up",
        icon: <Eye className="h-4 w-4" />,
      },
      {
        title: "Tiempo medio de sesión",
        value: formatDuration(current.averageSessionDuration), // ← NUEVO (mm:ss o h:mm:ss)
        delta:
          deltaPct.averageSessionDuration == null
            ? "—"
            : pf.format(deltaPct.averageSessionDuration),
        deltaVariant:
          deltaPct.averageSessionDuration != null &&
          deltaPct.averageSessionDuration < 0
            ? "down"
            : "up",
        icon: <Clock className="h-4 w-4" />,
      },
    ];
  }, [data]);

  if (isLoading || !items) {
    return <KPIListSkeleton className={className} stretch={stretch} />;
  }

  if (error) {
    return (
      <div className={`card ${className}`}>
        <div className="card-body text-sm text-red-500">
          Error cargando KPIs: {error.message}
        </div>
      </div>
    );
  }

  return <KPIList className={className} items={items} stretch={stretch} />;
}
