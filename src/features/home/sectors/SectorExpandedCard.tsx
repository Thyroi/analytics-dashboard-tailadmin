"use client";

import DonutLeader from "@/components/charts/DonutLeader";
import LineChart from "@/components/charts/LineChart";
import RangeControls from "@/components/dashboard/RangeControls";
import type { Granularity } from "@/lib/chatbot/tags";
import React, { useMemo } from "react";

export type SeriesPoint = { label: string; value: number };
export type DonutDatum = { label: string; value: number };

type BaseProps = {
  title: string;
  deltaPct: number;

  // Controles
  mode: "granularity" | "range";
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  onClearRange: () => void;

  // Series línea
  current: SeriesPoint[];
  previous: SeriesPoint[];

  // Donut Leader
  donutData: DonutDatum[];

  // UI
  onClose: () => void;

  // Paleta para pueblos
  isTown?: boolean;
};

type WithIcon = {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  imgSrc?: never;
};
type WithImage = {
  imgSrc: string | { src: string };
  Icon?: never;
};

type Props = BaseProps & (WithIcon | WithImage);

function formatPct(p: number) {
  const sign = p > 0 ? "+" : p < 0 ? "−" : "";
  return `${sign}${Math.abs(p).toLocaleString("es-ES", {
    maximumFractionDigits: 0,
  })}%`;
}

export default function SectorExpandedCard(props: Props) {
  const {
    title,
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
    isTown = false,
  } = props;

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

  const hasImage = "imgSrc" in props && !!props.imgSrc;
  const imageUrl = hasImage
    ? typeof (props as WithImage).imgSrc === "string"
      ? ((props as WithImage).imgSrc as string)
      : ((props as WithImage).imgSrc as { src: string }).src
    : "";

  const IconComp: React.ComponentType<React.SVGProps<SVGSVGElement>> | null =
    !hasImage && "Icon" in props ? (props as WithIcon).Icon : null;

  return (
    <div
      className="
        rounded-2xl border border-gray-200 dark:border-white/10
        bg-[#fff7ed] dark:bg-[#0c1116]
        p-3 shadow-sm w-full
      "
      // importante: permite que la card crezca si el contenido lo necesita
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`h-10 w-10 rounded-full grid place-items-center ${
            isTown
              ? "bg-white ring-1 ring-black/5 dark:ring-white/10"
              : "bg-[#E64E3C]"
          }`}
          data-testid="expanded-icon-badge"
        >
          {hasImage ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-6 w-6 object-contain"
              draggable={false}
            />
          ) : IconComp ? (
            <IconComp
              className={`h-6 w-6 ${
                isTown ? "text-[#E64E3C]" : "text-white"
              } fill-current stroke-current [&_*]:fill-current [&_*]:stroke-current`}
            />
          ) : null}
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

      {/* Controles de rango / granularidad */}
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

      {/* Contenido */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Área / línea */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3">
          <div className="w-full h-[320px]">
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
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Subcategorías
          </div>

          <DonutLeader data={donutData} height={280} className="w-full" padViewBox={20}/>

          <div
            className={`mt-3 text-center text-[28px] font-extrabold ${
              isUp ? "text-[#35C759]" : "text-[#E64C3C]"
            }`}
          >
            {formatPct(deltaPct)}
          </div>
        </div>
      </div>
    </div>
  );
}
