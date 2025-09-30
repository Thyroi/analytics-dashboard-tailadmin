"use client";

import React from "react";
import DonutSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DonutSection";
import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";
import DrilldownMultiLineSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DrilldownMultiLineSection";
import type { DonutDatum, SeriesPoint } from "@/lib/types";
import type { UrlSeries } from "@/features/analytics/services/drilldown";

type Base = {
  donutData: DonutDatum[];
  deltaPct: number;
  onDonutSlice?: (label: string) => void;
  className?: string;
  donutCenterLabel?: string;
  actionButtonTarget?: string;
};

type LineChartMode = Base & {
  mode: "line";
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
};

type MultiLineMode = Base & {
  mode: "multi";
  /** Eje X y series por sub-actividad (URL) */
  xLabels: string[];
  seriesBySub: UrlSeries[];
  loading?: boolean;
};

type Props = LineChartMode | MultiLineMode;

/**
 * Componente de layout 2 columnas:
 * - Izquierda: (Line | MultiLine)
 * - Derecha : DonutSection
 */
export default function ChartPair(props: Props) {
  return (
    <div className={`grid grid-cols-1 xl:grid-cols-2 gap-4 ${props.className ?? ""}`}>
      <div>
        {props.mode === "line" ? (
          <ChartSection
            categories={syncCategories(props.series.current, props.series.previous)}
            currData={props.series.current.slice(-minLen(props.series)).map((p) => p.value)}
            prevData={props.series.previous.slice(-minLen(props.series)).map((p) => p.value)}
          />
        ) : (
          <DrilldownMultiLineSection
            xLabels={props.xLabels}
            seriesBySub={props.seriesBySub}
            loading={props.loading}

          />
        )}
      </div>

      <DonutSection
        donutData={props.donutData}
        onSliceClick={props.onDonutSlice}
        centerLabel={props.donutCenterLabel}
        actionButtonTarget={props.actionButtonTarget}
      />
    </div>
  );
}

/* ---------- helpers internos ---------- */

function minLen(series: { current: SeriesPoint[]; previous: SeriesPoint[] }): number {
  return Math.min(series.current.length, series.previous.length);
}

function syncCategories(cur: SeriesPoint[], prev: SeriesPoint[]): string[] {
  const n = Math.min(cur.length, prev.length);
  return cur.slice(-n).map((p) => p.label);
}
