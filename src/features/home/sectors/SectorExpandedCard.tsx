"use client";

import DonutLeader from "@/components/charts/DonutLeader";
import LineChart from "@/components/charts/LineChart";
import RangeControls from "@/components/dashboard/RangeControls";
import type { Granularity } from "@/lib/chatbot/tags";
import React, { useMemo } from "react";

export type SeriesPoint = { label: string; value: number };
export type DonutDatum = { label: string; value: number };

type Props = {
  title: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  deltaPct: number;

  mode: "granularity" | "range";
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  onClearRange: () => void;

  current: SeriesPoint[];
  previous: SeriesPoint[];

  donutData: DonutDatum[];

  onClose: () => void;

  /** Si es un pueblo, cambia color de fondo del círculo del icono (opcional) */
  isTown?: boolean;
};

function formatPct(p: number) {
  const sign = p > 0 ? "+" : p < 0 ? "−" : "";
  return `${sign}${Math.abs(p).toLocaleString("es-ES", { maximumFractionDigits: 0 })}%`;
}

export default function SectorExpandedCard({
  title,
  Icon,
  deltaPct,
  mode,
  granularity,
  onGranularityChange,
  startDate,
  endDate,
  onRangeChange,
  onClearRange,
  current,
  previous,
  donutData,
  onClose,
}: Props) {
  const isUp = deltaPct >= 0;

  const { categories, currData, prevData } = useMemo(() => {
    const n = Math.min(current.length, previous.length);
    const curr = current.slice(current.length - n);
    const prev = previous.slice(previous.length - n);
    return {
      categories: curr.map((p) => p.label),
      currData: curr.map((p) => p.value),
      prevData: prev.map((p) => p.value),
    };
  }, [current, previous]);

  return (
    <div className="h-full w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-[#fff7ed] dark:bg-[#0c1116] p-3 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-[#E64E3C] text-white grid place-items-center">
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-2xl font-bold text-[#E64E3C] flex-1 leading-none">
          {title}
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full grid place-items-center bg-white/80 border border-gray-200 hover:bg-white"
          title="Cerrar detalle"
        >
          ✕
        </button>
      </div>

      {/* Controles */}
      <RangeControls
        mode={mode}
        granularity={granularity}
        onGranularityChange={onGranularityChange}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={onRangeChange}
        onClearRange={onClearRange}
        className="mb-3"
      />

      {/* Zona de gráficos: ocupa el resto de la altura */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Línea */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3 h-full">
          <div className="w-full h-full">
            <LineChart
              categories={categories}
              series={[
                { name: "Actual", data: currData },
                { name: "Anterior", data: prevData },
              ]}
              type="area"
              height="100%"
              showLegend={false}
              smooth
              colorsByName={{ Actual: "#16A34A", Anterior: "#9CA3AF" }}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Donut + delta */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3 h-full flex flex-col min-h-0">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Subcategorías
          </div>

          <div className="flex-1 min-h-0">
            <DonutLeader data={donutData} height="100%" className="w-full h-full" />
          </div>

          <div
            className={`mt-3 text-center text-[28px] font-extrabold ${
              isUp ? "text-[#35C759]" : "text-[#E74C3C]"
            }`}
          >
            {formatPct(deltaPct)}
          </div>
        </div>
      </div>
    </div>
  );
}
