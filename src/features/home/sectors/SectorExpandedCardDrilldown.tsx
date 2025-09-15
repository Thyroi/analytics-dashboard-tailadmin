"use client";

import DonutLeader, { type DonutDatum } from "@/components/charts/DonutLeader";
import LineChart from "@/components/charts/LineChart";
import RangeControls from "@/components/dashboard/RangeControls";
import type { Granularity } from "@/lib/chatbot/tags";
import React, { useMemo } from "react";

export type SeriesPoint = { label: string; value: number };

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

  // PAR SUPERIOR (NO REACTIVO)
  current: SeriesPoint[];
  previous: SeriesPoint[];
  donutData: DonutDatum[];

  // UI
  onClose: () => void;
  isTown?: boolean;

  // Interacción parte superior
  onDonutSliceClick?: (d: DonutDatum, meta?: { index: number }) => void;
  breadcrumb?: Array<{ id: string; label: string; type?: "tag" | "pueblo" | "subtag" }>;
  onBreadcrumbClick?: (
    node: { id: string; label: string; type?: "tag" | "pueblo" | "subtag" },
    index: number
  ) => void;
  donutTitle?: string;
  donutMaxSlices?: number;          // default 999 (sin "Otros")

  // PAR INFERIOR (DETALLE por pueblo - REACTIVO)
  detailCurrent?: SeriesPoint[];
  detailPrevious?: SeriesPoint[];
  detailDonutData?: DonutDatum[];
  detailDeltaPct?: number;
  detailDonutTitle?: string;
  detailDonutMaxSlices?: number;    // default 8
  onDetailDonutSliceClick?: (d: DonutDatum, meta?: { index: number }) => void;

  // SUBDETALLE (tercer nivel - REACTIVO si existe)
  subDetailCurrent?: SeriesPoint[];
  subDetailPrevious?: SeriesPoint[];
  subDetailDonutData?: DonutDatum[];  // opcional, si hubiese un 4º nivel
  subDetailDeltaPct?: number;
  subDetailDonutTitle?: string;
  subDetailDonutMaxSlices?: number;
  onSubDetailDonutSliceClick?: (d: DonutDatum, meta?: { index: number }) => void;
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
  return `${sign}${Math.abs(p).toLocaleString("es-ES", { maximumFractionDigits: 0 })}%`;
}

export default function SectorExpandedCardDrilldown(props: Props) {
  const {
    title, deltaPct, mode, granularity, onGranularityChange,
    startDate, endDate, onRangeChange, onClearRange,
    current, previous, donutData, onClose, isTown = false,

    onDonutSliceClick, breadcrumb, onBreadcrumbClick,
    donutTitle = "Subcategorías", donutMaxSlices = 999,

    // detalle (2º nivel)
    detailCurrent, detailPrevious, detailDonutData,
    detailDeltaPct, detailDonutTitle = "Detalle", detailDonutMaxSlices = 8,
    onDetailDonutSliceClick,

    // subdetalle (3º nivel)
    subDetailCurrent, subDetailPrevious, subDetailDonutData,
    subDetailDeltaPct, subDetailDonutTitle = "Subdetalle", subDetailDonutMaxSlices = 8,
    onSubDetailDonutSliceClick,
  } = props;

  const isUp = deltaPct >= 0;

  // --------- PAR SUPERIOR ---------
  const top = useMemo(() => {
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

  // --------- PAR INFERIOR (detalle) ---------
  const hasDetail =
    !!detailCurrent && !!detailPrevious && !!detailDonutData &&
    detailCurrent.length > 0 && detailPrevious.length > 0 && detailDonutData.length > 0;

  const bottom = useMemo(() => {
    if (!detailCurrent || !detailPrevious) return null;
    const n = Math.min(detailCurrent.length, detailPrevious.length);
    const curr = detailCurrent.slice(detailCurrent.length - n);
    const prev = detailPrevious.slice(detailPrevious.length - n);
    return {
      categories: curr.map((p) => p.label),
      currData: curr.map((p) => p.value),
      prevData: prev.map((p) => p.value),
    };
  }, [detailCurrent, detailPrevious]);

  // --------- SUBDETALLE (3er nivel) ---------
  const hasSubDetail =
    !!subDetailCurrent && !!subDetailPrevious &&
    subDetailCurrent.length > 0 && subDetailPrevious.length > 0;

  const deep = useMemo(() => {
    if (!subDetailCurrent || !subDetailPrevious) return null;
    const n = Math.min(subDetailCurrent.length, subDetailPrevious.length);
    const curr = subDetailCurrent.slice(subDetailCurrent.length - n);
    const prev = subDetailPrevious.slice(subDetailPrevious.length - n);
    return {
      categories: curr.map((p) => p.label),
      currData: curr.map((p) => p.value),
      prevData: prev.map((p) => p.value),
    };
  }, [subDetailCurrent, subDetailPrevious]);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-[#fff7ed] dark:bg-[#0c1116] p-3 shadow-sm w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`h-10 w-10 rounded-full grid place-items-center ${
            isTown ? "bg-white ring-1 ring-black/5 dark:ring-white/10" : "bg-[#E64E3C]"
          }`}
          data-testid="expanded-icon-badge"
        >
          {hasImage ? (
            <img src={imageUrl} alt={title} className="h-6 w-6 object-contain" draggable={false} />
          ) : IconComp ? (
            <IconComp
              className={`h-6 w-6 ${isTown ? "text-[#E64E3C]" : "text-white"} fill-current stroke-current [&_*]:fill-current [&_*]:stroke-current`}
            />
          ) : null}
        </div>

        <div className="text-2xl font-bold text-[#E64E3C] flex-1 leading-none">{title}</div>

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

      {/* ========= PAR SUPERIOR (NO REACTIVO) ========= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3">
          <div className="w-full h-[320px]">
            <LineChart
              categories={top.categories}
              series={[
                { name: "Actual", data: top.currData },
                { name: "Anterior", data: top.prevData },
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

        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{donutTitle}</div>
          <DonutLeader
            data={donutData}
            height={280}
            className={`w-full ${onDonutSliceClick ? "cursor-pointer" : ""}`}
            padViewBox={20}
            maxSlices={donutMaxSlices}
            onSliceClick={onDonutSliceClick ? (d, meta) => onDonutSliceClick(d, meta) : undefined}
          />
          <div className={`mt-3 text-center text-[28px] font-extrabold ${isUp ? "text-[#35C759]" : "text-[#E64C3C]"}`}>
            {formatPct(deltaPct)}
          </div>
        </div>
      </div>

      {/* ========= BREADCRUMB ========= */}
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
            {breadcrumb.map((node, idx) => {
              const isLast = idx === breadcrumb.length - 1;
              const clickable = !!onBreadcrumbClick && !isLast;
              return (
                <div key={`${node.id}-${idx}`} className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={clickable ? () => onBreadcrumbClick?.(node, idx) : undefined}
                    className={`px-2 py-1 rounded-full border ${
                      clickable
                        ? "bg-white hover:bg-gray-50 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300"
                        : "bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 cursor-default"
                    }`}
                    title={node.label}
                  >
                    {node.label}
                  </button>
                  {!isLast && <span className="text-gray-400">/</span>}
                </div>
              );
            })}
          </div>

          {/* ========= PAR INFERIOR (DETALLE) ========= */}
          {hasDetail && bottom && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3">
                <div className="w-full h-[320px]">
                  <LineChart
                    categories={bottom.categories}
                    series={[
                      { name: "Actual", data: bottom.currData },
                      { name: "Anterior", data: bottom.prevData },
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

              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {detailDonutTitle}
                </div>
                <DonutLeader
                  data={detailDonutData!}
                  height={280}
                  className={`w-full ${onDetailDonutSliceClick ? "cursor-pointer" : ""}`}
                  padViewBox={20}
                  maxSlices={detailDonutMaxSlices}
                  onSliceClick={
                    onDetailDonutSliceClick ? (d, meta) => onDetailDonutSliceClick(d, meta) : undefined
                  }
                />
                <div
                  className={`mt-3 text-center text-[28px] font-extrabold ${
                    (detailDeltaPct ?? 0) >= 0 ? "text-[#35C759]" : "text-[#E64C3C]"
                  }`}
                >
                  {formatPct(detailDeltaPct ?? 0)}
                </div>
              </div>
            </div>
          )}

          {/* ========= SUBDETALLE (3er nivel) ========= */}
          {hasSubDetail && deep && (
            <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3">
                <div className="w-full h-[320px]">
                  <LineChart
                    categories={deep.categories}
                    series={[
                      { name: "Actual", data: deep.currData },
                      { name: "Anterior", data: deep.prevData },
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

              {/* Donut opcional para un 4º nivel (si existiera). Si no, lo omitimos. */}
              {subDetailDonutData && subDetailDonutData.length > 0 && (
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {subDetailDonutTitle}
                  </div>
                  <DonutLeader
                    data={subDetailDonutData}
                    height={280}
                    className={`w-full ${onSubDetailDonutSliceClick ? "cursor-pointer" : ""}`}
                    padViewBox={20}
                    maxSlices={subDetailDonutMaxSlices}
                    onSliceClick={
                      onSubDetailDonutSliceClick ? (d, meta) => onSubDetailDonutSliceClick(d, meta) : undefined
                    }
                  />
                  <div
                    className={`mt-3 text-center text-[28px] font-extrabold ${
                      (subDetailDeltaPct ?? 0) >= 0 ? "text-[#35C759]" : "text-[#E64C3C]"
                    }`}
                  >
                    {formatPct(subDetailDeltaPct ?? 0)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
