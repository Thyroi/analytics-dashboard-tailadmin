"use client";

import KPIListSkeleton from "@/components/skeletons/KPIListSkeleton";
import ChartSectionSkeleton from "@/features/analytics/skeletons/ChartSectionSkeleton";
import DonutSectionSkeleton from "@/features/analytics/skeletons/DonutSectionSkeleton";

type Props = {
  /** alto del chart central (engagement) */
  chartHeight?: number | string;
  /** muestra el botón “Cerrar” placeholder */
  showClose?: boolean;
  className?: string;
};

export default function UrlDetailsPanelSkeleton({
  chartHeight = 260,
  showClose = true,
  className = "",
}: Props) {
  return (
    <div
      className={[
        "w-full p-6 rounded-lg shadow-sm border",
        "border-red-200/60",
        "bg-gradient-to-r from-white via-[#fef2f2] to-[#fff7ed]",
        className,
      ].join(" ")}
      aria-busy
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3 pb-3 border-b border-red-200/60">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-red-200/70" />
          <div>
            <div className="h-4 w-40 rounded bg-gray-200/70" />
            <div className="mt-2 h-3 w-64 rounded bg-gray-200/60" />
          </div>
        </div>
        {showClose && (
          <div className="h-8 w-16 rounded-lg bg-gray-100 border border-gray-200" />
        )}
      </div>

      {/* KPIs */}
      <section className="mb-6">
        <div className="h-4 w-56 rounded bg-gray-200/70 mb-3" />
        <KPIListSkeleton count={4} direction="horizontal" itemsPerPage={4} />
      </section>

      {/* Engagement chart */}
      <section className="mb-6">
        <div className="h-4 w-72 rounded bg-gray-200/70 mb-3" />
        <ChartSectionSkeleton height={chartHeight} />
      </section>

      {/* Donuts grid (3) */}
      <section>
        <div className="h-4 w-72 rounded bg-gray-200/70 mb-3" />
        <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-3">
          <DonutSectionSkeleton />
          <DonutSectionSkeleton />
          <DonutSectionSkeleton />
        </div>
      </section>
    </div>
  );
}
