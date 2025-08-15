"use client";

import KPICard from "@/components/dashboard/KPICard";
import type { ReactNode } from "react";

export type KPIItem = {
  title: string;
  value: string;
  delta: string;
  deltaVariant?: "up" | "down";
  icon?: ReactNode;
};

export default function KPIList({
  items,
  className = "",
  stretch = false,
}: {
  items: KPIItem[];
  className?: string;
  stretch?: boolean;
}) {
  if (!stretch) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {items.map((kpi) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            delta={kpi.delta}
            deltaVariant={kpi.deltaVariant}
            icon={kpi.icon}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 h-full ${className}`}>
      {items.map((kpi) => (
        <div className="flex-1" key={kpi.title}>
          <KPICard
            className="h-full"
            title={kpi.title}
            value={kpi.value}
            delta={kpi.delta}
            deltaVariant={kpi.deltaVariant}
            icon={kpi.icon}
          />
        </div>
      ))}
    </div>
  );
}
