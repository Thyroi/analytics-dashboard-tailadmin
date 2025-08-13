// src/components/dashboard/AnalyticsKPICards.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import KPICard from "@/components/dashboard/KPICard";
import AnalyticsKPICardsSkeleton from "@/components/skeletons/AnalyticsKPICardsSkeleton";
import { Bolt, MousePointer2, Users } from "lucide-react";

type KpiTotals = {
  activeUsers: number;
  engagedSessions: number;
  eventCount: number;
};

type KpiPayload = {
  current: KpiTotals;
  previous: KpiTotals;
  deltaPct: {
    activeUsers: number | null;
    engagedSessions: number | null;
    eventCount: number | null;
  };
};

function isKpiPayload(x: unknown): x is KpiPayload {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.current === "object" &&
    typeof o.previous === "object" &&
    typeof o.deltaPct === "object"
  );
}

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const pf = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });

const formatDate = (d: Date) => d.toISOString().split("T")[0];

export default function AnalyticsKPICards({
  className = "",
  /** Si true, ocupa toda la altura del contenedor y reparte 1/3 por tarjeta */
  stretch = true,
}: {
  className?: string;
  stretch?: boolean;
}) {
  // Rango fijo por defecto: último mes hasta hoy (sin DatePicker)
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);
  const startISO = formatDate(lastMonth);
  const endISO = formatDate(today);

  const [data, setData] = useState<KpiPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function fetchKPIs(start: string, end: string): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/kpis?start=${start}&end=${end}`);
      const json: unknown = await res.json();
      if (!isKpiPayload(json)) throw new Error("Formato de respuesta inválido");
      setData(json);
    } catch (e) {
      console.error("Error KPIs:", e);
      setData(null);
    } finally {
      setTimeout(() => setLoading(false), 120);
    }
  }

  useEffect(() => {
    void fetchKPIs(startISO, endISO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = useMemo(() => {
    if (!data) return null;
    const { current, deltaPct } = data;

    return [
      {
        title: "Active Users",
        value: nf.format(current.activeUsers),
        delta: deltaPct.activeUsers === null ? "—" : pf.format(deltaPct.activeUsers),
        variant: deltaPct.activeUsers !== null && deltaPct.activeUsers < 0 ? "down" : "up",
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: "Engaged Sessions",
        value: nf.format(current.engagedSessions),
        delta: deltaPct.engagedSessions === null ? "—" : pf.format(deltaPct.engagedSessions),
        variant:
          deltaPct.engagedSessions !== null && deltaPct.engagedSessions < 0 ? "down" : "up",
        icon: <MousePointer2 className="h-4 w-4" />,
      },
      {
        title: "Events",
        value: nf.format(current.eventCount),
        delta: deltaPct.eventCount === null ? "—" : pf.format(deltaPct.eventCount),
        variant: deltaPct.eventCount !== null && deltaPct.eventCount < 0 ? "down" : "up",
        icon: <Bolt className="h-4 w-4" />,
      },
    ] as const;
  }, [data]);

  // Contenedor base
  const baseClass = `flex flex-col ${stretch ? "h-full" : ""} ${className}`;

  if (loading || !kpis) {
    return <AnalyticsKPICardsSkeleton className={baseClass} stretch={stretch} />;
  }

  // Modo compacto (altura natural)
  if (!stretch) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <KPICard
          title={kpis[0].title}
          value={kpis[0].value}
          delta={kpis[0].delta}
          deltaVariant={kpis[0].variant === "down" ? "down" : "up"}
          icon={kpis[0].icon}
        />
        <KPICard
          title={kpis[1].title}
          value={kpis[1].value}
          delta={kpis[1].delta}
          deltaVariant={kpis[1].variant === "down" ? "down" : "up"}
          icon={kpis[1].icon}
        />
        <KPICard
          title={kpis[2].title}
          value={kpis[2].value}
          delta={kpis[2].delta}
          deltaVariant={kpis[2].variant === "down" ? "down" : "up"}
          icon={kpis[2].icon}
        />
      </div>
    );
  }

  // Modo stretch: cada tarjeta ocupa 1/3 del alto disponible
  return (
    <div className={baseClass}>
      <div className="flex flex-col gap-2 h-full">
        <div className="flex-1">
          <KPICard
            className="h-full"
            title={kpis[0].title}
            value={kpis[0].value}
            delta={kpis[0].delta}
            deltaVariant={kpis[0].variant === "down" ? "down" : "up"}
            icon={kpis[0].icon}
          />
        </div>
        <div className="flex-1">
          <KPICard
            className="h-full"
            title={kpis[1].title}
            value={kpis[1].value}
            delta={kpis[1].delta}
            deltaVariant={kpis[1].variant === "down" ? "down" : "up"}
            icon={kpis[1].icon}
          />
        </div>
        <div className="flex-1">
          <KPICard
            className="h-full"
            title={kpis[2].title}
            value={kpis[2].value}
            delta={kpis[2].delta}
            deltaVariant={kpis[2].variant === "down" ? "down" : "up"}
            icon={kpis[2].icon}
          />
        </div>
      </div>
    </div>
  );
}
