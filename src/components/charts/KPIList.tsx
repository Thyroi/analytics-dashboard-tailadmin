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
  maxHeight?: number | string; // Altura máxima opcional
};

export default function KPIList({
  items,
  className = "",
  stretch = false,
  direction = "vertical",
  itemsPerPage,
  showPager = true,
  maxHeight,
}: Props) {
  const [page, setPage] = useState(0);

  const pages = useMemo(() => {
    if (!itemsPerPage) return 1;
    return Math.max(1, Math.ceil(items.length / Math.max(1, itemsPerPage)));
  }, [items.length, itemsPerPage]);

  const sliceStart = page * (itemsPerPage ?? items.length);
  const slice = items.slice(sliceStart, sliceStart + (itemsPerPage ?? items.length));

  const next = () => setPage((p) => Math.min(pages - 1, p + 1));
  const prev = () => setPage((p) => Math.max(0, p - 1));

  // estilos seguros para TS
  const containerMaxH: CSSProperties | undefined = maxHeight
    ? { maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight }
    : undefined;

  // === LAYOUT HORIZONTAL ===
  if (direction === "horizontal") {
    return (
      <div className={`w-full ${className}`} style={containerMaxH}>
        <div
          className={`
            grid gap-4
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
          `}
        >
          {slice.map((kpi) => (
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

        {/* Solo mostrar paginación si itemsPerPage está definido y hay más páginas */}
        {itemsPerPage && showPager && items.length > itemsPerPage && (
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

  // === LAYOUT VERTICAL ===
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

  // Vertical con stretch: ocupa todo el alto y filas iguales
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
