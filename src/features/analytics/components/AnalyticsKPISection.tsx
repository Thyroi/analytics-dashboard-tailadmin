"use client";

import KPIList, { type KPIItem } from "@/components/charts/KPIList";
import KPIListSkeleton from "@/components/skeletons/KPIListSkeleton";
import { fetchKpis } from "@/features/analytics/services/kpis";
import type { KpiPayload } from "@features/analytics/types";
import { Bolt, MousePointer2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const pf = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});
const toISO = (d: Date) => d.toISOString().split("T")[0];

export default function AnalyticsKPISection({
  className = "",
  stretch = true,
}: {
  className?: string;
  /** Si true, cada tarjeta ocupa 1/3 del alto del contenedor */
  stretch?: boolean;
}) {
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);

  const [data, setData] = useState<KpiPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const payload = await fetchKpis({
          start: toISO(lastMonth),
          end: toISO(today),
        });
        if (!cancelled) setData(payload);
      } catch (err) {
        console.error("Error KPIs:", err);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setTimeout(() => setLoading(false), 120); // anti-flash
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items: KPIItem[] | null = useMemo(() => {
    if (!data) return null;
    const { current, deltaPct } = data;
    return [
      {
        title: "Active Users",
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
        title: "Engaged Sessions",
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
        title: "Events",
        value: nf.format(current.eventCount),
        delta:
          deltaPct.eventCount == null ? "—" : pf.format(deltaPct.eventCount),
        deltaVariant:
          deltaPct.eventCount != null && deltaPct.eventCount < 0
            ? "down"
            : "up",
        icon: <Bolt className="h-4 w-4" />,
      },
    ];
  }, [data]);

  if (loading || !items) {
    return <KPIListSkeleton className={className} stretch={stretch} />;
  }

  return <KPIList className={className} items={items} stretch={stretch} />;
}
