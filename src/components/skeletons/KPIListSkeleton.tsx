"use client";

import KPICardSkeleton from "@/components/skeletons/KPICardSkeleton";
import type { CSSProperties } from "react";

type Props = {
  count?: number;
  className?: string;
  stretch?: boolean;
  direction?: "vertical" | "horizontal";
  itemsPerPage?: number;
  showPager?: boolean;
  maxHeight?: number | string;
};

export default function KPIListSkeleton({
  count = 3,
  className = "",
  stretch = false,
  direction = "vertical",
  itemsPerPage,
  showPager = true,
  maxHeight,
}: Props) {
  // Normaliza estilos “seguros” para TS
  const containerMaxH: CSSProperties | undefined = maxHeight
    ? {
        maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
      }
    : undefined;

  /* ============================
     LAYOUT HORIZONTAL (grid)
     ============================ */
  if (direction === "horizontal") {
    const perPage = itemsPerPage ?? count; // si no hay itemsPerPage, mostramos todos
    const visible = Math.min(count, perPage);
    const pages =
      itemsPerPage && count > 0 ? Math.ceil(count / Math.max(1, perPage)) : 1;

    return (
      <div className={`w-full ${className}`} style={containerMaxH} aria-busy>
        <div
          className={`
            grid gap-4
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
          `}
        >
          {Array.from({ length: visible }).map((_, i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>

        {/* Paginación “fake” cuando aplica */}
        {itemsPerPage && showPager && count > itemsPerPage && (
          <div className="mt-3 flex items-center justify-center gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === 0
                    ? "bg-gray-300 dark:bg-white/20"
                    : "bg-gray-200 dark:bg-white/10"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ============================
     LAYOUT VERTICAL
     ============================ */
  if (!stretch) {
    return (
      <div
        className={`flex flex-col gap-2 ${className}`}
        style={containerMaxH}
        aria-busy
      >
        {Array.from({ length: count }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Vertical con stretch: filas iguales que ocupan todo el alto disponible
  const rows = Math.max(1, count);
  const stretchGridStyle: CSSProperties = {
    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
    ...(containerMaxH ?? {}),
  };

  return (
    <div
      className={`grid h-full min-h-0 gap-2 ${className}`}
      style={stretchGridStyle}
      aria-busy
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="min-h-0">
          <KPICardSkeleton className="h-full" />
        </div>
      ))}
    </div>
  );
}
