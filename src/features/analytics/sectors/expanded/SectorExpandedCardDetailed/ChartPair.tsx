"use client";

import DonutSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DonutSection";
import DrilldownMultiLineSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DrilldownMultiLineSection";
import type { UrlSeries } from "@/features/analytics/services/drilldown";
import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { formatChartLabelsSimple } from "@/lib/utils/charts/labelFormatting";

/* ===== helpers internos ===== */
function minLen(series: {
  current: SeriesPoint[];
  previous: SeriesPoint[];
}): number {
  return Math.min(series.current.length, series.previous.length);
}

type Base = {
  donutData: DonutDatum[];
  deltaPct: number | null;
  onDonutSlice?: (label: string) => void;
  className?: string;
  donutCenterLabel?: string;
  actionButtonTarget?: string;
  showActivityButton?: boolean;
  /** Para formatear el eje X en el modo "line" */
  granularity?: Granularity;
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
 * Layout 2 columnas:
 *  - Izquierda: (Line | MultiLine)
 *  - Derecha : DonutSection
 */
export default function ChartPair(props: Props) {
  return (
    <div
      className={`grid grid-cols-1 xl:grid-cols-2 gap-4 ${
        props.className ?? ""
      }`}
    >
      <div>
        {props.mode === "line" ? (
          <LineSide series={props.series} granularity={props.granularity} />
        ) : (
          <DrilldownMultiLineSection
            xLabels={props.xLabels}
            seriesBySub={props.seriesBySub}
            loading={props.loading}
            granularity={props.granularity}
          />
        )}
      </div>

      <DonutSection
        donutData={props.donutData}
        onSliceClick={props.onDonutSlice}
        centerLabel={props.donutCenterLabel}
        actionButtonTarget={props.actionButtonTarget}
        showActivityButton={props.showActivityButton}
      />
    </div>
  );
}

/* ===== left side (line) ===== */
function LineSide({
  series,
  granularity = "d",
}: {
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  granularity?: Granularity;
}) {
  // categorías originales desde la serie current (ya viene bucketizada por backend)
  const rawCats = series.current.map((p) => p.label);

  // n efectivo
  const nSeries = minLen(series);
  const n = Math.min(nSeries, rawCats.length);

  // recortes alineados
  const cats = formatChartLabelsSimple(rawCats.slice(-n), granularity);
  const curr = series.current.slice(-n).map((p) => p.value);
  const prev = series.previous.slice(-n).map((p) => p.value);

  return <ChartSection categories={cats} currData={curr} prevData={prev} />;
}
