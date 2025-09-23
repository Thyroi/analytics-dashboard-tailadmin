"use client";

import { useMemo } from "react";
import type { Granularity } from "@/lib/types";
import { useGender, colorizeGender } from "@/features/analytics/hooks/useGender";
import DonutLeader from "@/components/charts/DonutLeader";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";

const CHART_HEIGHT = 260;

type Props = {
  start?: string;
  end?: string;
  granularity?: Granularity; // "d" | "w" | "m" | "y"
  className?: string;
};

export default function GenderDonutSection({
  start,
  end,
  granularity = "d",
  className,
}: Props) {
  const { data, isLoading, error } = useGender({ start, end, granularity });
  const series = useMemo(() => colorizeGender(data?.items ?? []), [data?.items]);

  return (
    <div className={`card overflow-hidden ${className ?? ""}`}>
      <div className="card-header">
        <h3 className="card-title">Usuarios por género</h3>
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
            totalFormatter={(t) => Intl.NumberFormat().format(t)}
            // labelFormatter={({ label, pct }) => `${label} ${pct.toFixed(0)}%`} // opcional
          />
        )}
      </div>
    </div>
  );
}
