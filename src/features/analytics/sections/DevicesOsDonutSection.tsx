"use client";

import { useMemo } from "react";
import type { Granularity } from "@/lib/types";
import { useDevicesOs, colorizeOs } from "@/features/analytics/hooks/useDevicesOs";
import DonutLeader from "@/components/charts/DonutLeader";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";

const CHART_HEIGHT = 260;

type Props = {
  start?: string;
  end?: string;
  granularity?: Granularity; // "d" | "w" | "m" | "y"
  className?: string;
};

export default function DevicesOsDonutSection({
  start,
  end,
  granularity = "d",
  className,
}: Props) {
  const { data, isLoading, error } = useDevicesOs({ start, end, granularity });
  const series = useMemo(() => colorizeOs(data?.items ?? []), [data?.items]);

  return (
    <div className={`card overflow-hidden ${className ?? ""}`}>
      <div className="card-header">
        <h3 className="card-title">Usuarios por sistema operativo</h3>
      </div>

      <div className="card-body">
        {isLoading ? (
          <ChartSkeleton height={CHART_HEIGHT} />
        ) : error ? (
          <div
            className="text-sm text-red-500 flex items-center justify-center"
            style={{ height: CHART_HEIGHT }}
          >
            {error.message}
          </div>
        ) : series.length === 0 ? (
          <div
            className="text-sm text-gray-400 flex items-center justify-center"
            style={{ height: CHART_HEIGHT }}
          >
            Sin datos en el rango
          </div>
        ) : (
          <DonutLeader
            data={series}
            height={CHART_HEIGHT}
            showCenterTotal
            centerTitle="Total"
            // opcional: cómo quieres formatear el total
            totalFormatter={(t) => Intl.NumberFormat().format(t)}
            // opcional: formateo de labels
            // labelFormatter={({ label, pct }) => `${label} ${pct.toFixed(0)}%`}
          />
        )}
      </div>
    </div>
  );
}
