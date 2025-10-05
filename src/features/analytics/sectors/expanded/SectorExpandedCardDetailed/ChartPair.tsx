"use client";

import DonutSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DonutSection";
import DrilldownMultiLineSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DrilldownMultiLineSection";
import type { UrlSeries } from "@/features/analytics/services/drilldown";
import {
  ChartSectionSkeleton,
  DonutSectionSkeleton,
} from "@/features/analytics/skeletons";
import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";

import type { DonutDatum, SeriesPoint } from "@/lib/types";

type Base = {
  donutData: DonutDatum[];
  deltaPct: number | null; // no usado para cálculos
  onDonutSlice?: (label: string) => void;
  className?: string;
  donutCenterLabel?: string;
  actionButtonTarget?: string;
  /** NEW: muestra skeletons cuando true */
  loading?: boolean;
};

type LineChartMode = Base & {
  mode: "line";
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
};

type MultiLineMode = Base & {
  mode: "multi";
  xLabels: string[];
  seriesBySub: UrlSeries[];
  loading?: boolean; // se mantiene para compat
};

type Props = LineChartMode | MultiLineMode;

/** Layout 2 columnas: Izq (Line|MultiLine) · Der (Donut) */
export default function ChartPair(props: Props) {
  const isLoading = props.loading === true;

  return (
    <div
      className={`grid grid-cols-1 xl:grid-cols-2 gap-4 ${
        props.className ?? ""
      }`}
    >
      {/* IZQUIERDA */}
      <div>
        {props.mode === "line" ? (
          isLoading ? (
            <ChartSectionSkeleton />
          ) : (
            <ChartSection
              categories={syncCategories(
                props.series.current,
                props.series.previous
              )}
              currData={props.series.current
                .slice(-minLen(props.series))
                .map((p) => p.value)}
              prevData={props.series.previous
                .slice(-minLen(props.series))
                .map((p) => p.value)}
            />
          )
        ) : (
          <DrilldownMultiLineSection
            xLabels={props.xLabels}
            seriesBySub={props.seriesBySub}
            loading={isLoading}
          />
        )}
      </div>

      {/* DERECHA: Donut */}
      {isLoading ? (
        <DonutSectionSkeleton />
      ) : (
        <DonutSection
          donutData={props.donutData}
          onSliceClick={props.onDonutSlice}
          centerLabel={props.donutCenterLabel}
          actionButtonTarget={props.actionButtonTarget}
        />
      )}
    </div>
  );
}

/* ---------- helpers internos ---------- */
function minLen(series: {
  current: SeriesPoint[];
  previous: SeriesPoint[];
}): number {
  return Math.min(series.current.length, series.previous.length);
}
function syncCategories(cur: SeriesPoint[], prev: SeriesPoint[]): string[] {
  const n = Math.min(cur.length, prev.length);
  return cur.slice(-n).map((p) => p.label);
}
