"use client";

import { useMemo, useState, type CSSProperties } from "react";
import KPICard from "@/components/dashboard/KPICard";
import type { ReactNode } from "react";
import PagerDots from "@/components/common/PagerDots";

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
  /** Altura máxima opcional del contenedor (px o %, etc.) */
  maxHeight?: number | string;
};

export default function KPIList({
  items,
  className = "",
  stretch = false,
  direction = "vertical",
  itemsPerPage = 3,
  showPager = true,
  maxHeight,
}: Props) {
  const [page, setPage] = useState(0);

  const pages = useMemo(
    () => Math.max(1, Math.ceil(items.length / Math.max(1, itemsPerPage))),
    [items.length, itemsPerPage]
  );

  const sliceStart = page * itemsPerPage;
  const slice = items.slice(sliceStart, sliceStart + itemsPerPage);

  const next = () => setPage((p) => Math.min(pages - 1, p + 1));
  const prev = () => setPage((p) => Math.max(0, p - 1));

  // estilos seguros para TS
  const containerMaxH: CSSProperties | undefined =
    maxHeight !== undefined
      ? { maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight }
      : undefined;

  // VERTICAL
  if (direction === "vertical") {
    if (!stretch) {
      return (
        <div className={`flex flex-col gap-2 ${className}`} style={containerMaxH}>
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

    // stretch: filas iguales, full width/height, con separación
    const stretchGridStyle: CSSProperties = {
      gridTemplateRows: `repeat(${items.length}, minmax(0, 1fr))`,
    };
    if (containerMaxH?.maxHeight) stretchGridStyle.maxHeight = containerMaxH.maxHeight;

    return (
      <div className={`grid h-full min-h-0 gap-2 ${className}`} style={stretchGridStyle}>
        {items.map((kpi) => (
          <div key={kpi.title} className="min-h-0">
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

  // HORIZONTAL (carousel)
  return (
    <div className={className} style={containerMaxH}>
      <div className="flex items-stretch gap-2 my-4">
        {slice.map((kpi) => (
          <div key={kpi.title} className={stretch ? "flex-1" : "shrink-0"} style={!stretch ? { width: 250 } : undefined}>
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
        <PagerDots className="mt-3" page={page} pages={pages} onPrev={prev} onNext={next} />
      )}
    </div>
  );
}
