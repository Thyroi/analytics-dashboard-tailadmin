"use client";

import React, { useMemo } from "react";
import LineChart from "@/components/charts/LineChart";

export type SubSeries = { name: string; data: number[] };

type Props = {
  xLabels: string[];
  seriesBySub: SubSeries[];
  loading?: boolean;
  height?: number | string;
  maxSeries?: number;
  smooth?: boolean;
  className?: string;
  emptyHint?: string;
};

function padToLen(arr: number[], len: number): number[] {
  if (arr.length === len) return arr;
  if (arr.length > len) return arr.slice(0, len);
  const out = arr.slice();
  while (out.length < len) out.push(0);
  return out;
}

export default function DrilldownMultiLineSection({
  xLabels,
  seriesBySub,
  loading = false,
  height = 320,
  maxSeries = 5,
  smooth = true,
  className = "",
  emptyHint = "No hay datos para mostrar en este rango.",
}: Props) {
  const safeX = xLabels ?? [];
  const safeSeries = seriesBySub ?? [];

  const chartSeries = useMemo(() => {
    const N = Math.max(0, Math.min(maxSeries, safeSeries.length));
    return safeSeries
      .slice(0, N)
      .map((s) => ({ name: s.name, data: padToLen(s.data ?? [], safeX.length) }));
  }, [safeSeries, safeX, maxSeries]);

  const hasData = useMemo(
    () => chartSeries.some((s) => (s.data ?? []).some((v) => v > 0)),
    [chartSeries]
  );

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3 ${className}`}>
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Sub-actividades (comparativa por URL)
      </div>

      {loading && (
        <div
          className="w-full rounded-md bg-gray-100 dark:bg-white/5 animate-pulse"
          style={{ height: typeof height === "number" ? `${height}px` : height }}
        />
      )}

      {!loading && chartSeries.length === 0 && (
        <div
          className="w-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400"
          style={{ height: typeof height === "number" ? `${height}px` : height }}
        >
          {emptyHint}
        </div>
      )}

      {!loading && chartSeries.length > 0 && (
        <div className="w-full" style={{ height: typeof height === "number" ? `${height}px` : height }}>
          <LineChart
            categories={safeX}
            series={chartSeries.map((s) => ({ name: s.name, data: s.data }))}
            type="line"
            height="100%"
            showLegend={true}
            smooth={smooth}
            className="w-full h-full"
          />
          {!hasData && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              No hay valores distintos de 0 en el rango seleccionado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
