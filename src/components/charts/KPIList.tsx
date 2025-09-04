"use client";

import { useMemo, useState } from "react";
import KPICard from "@/components/dashboard/KPICard";
import PagerDots from "@/components/common/PagerDots";
import type { ReactNode } from "react";

export type KPIItem = {
  title: string;
  value: string;
  delta: string;
  deltaVariant?: "up" | "down";
  icon?: ReactNode;
};

type Props = {
  items: KPIItem[];
  className?: string;
  stretch?: boolean;
  direction?: "vertical" | "horizontal";
  itemsPerPage?: number;
  showPager?: boolean;
};

export default function KPIList({
  items,
  className = "",
  stretch = false,
  direction = "vertical",
  itemsPerPage = 3,
  showPager = true,
}: Props) {
  // Hooks SIEMPRE en la parte superior
  const [page, setPage] = useState(0);

  const pages = useMemo(
    () => Math.max(1, Math.ceil(items.length / Math.max(1, itemsPerPage))),
    [items.length, itemsPerPage]
  );

  const sliceStart = page * itemsPerPage;
  const slice = items.slice(sliceStart, sliceStart + itemsPerPage);

  const next = () => setPage((p) => Math.min(pages - 1, p + 1));
  const prev = () => setPage((p) => Math.max(0, p - 1));

  // Render vertical
  if (direction === "vertical") {
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

  // Render horizontal
  return (
    <div className={className}>
      <div className="flex items-stretch gap-2 my-4">
        {slice.map((kpi) => (
          <div
            key={kpi.title}
            className={stretch ? "flex-1" : "shrink-0"}
            style={!stretch ? { width: 250 } : undefined}
          >
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

      {showPager && items.length > itemsPerPage && (
        <PagerDots
          className="mt-3"
          page={page}
          pages={pages}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  );
}
