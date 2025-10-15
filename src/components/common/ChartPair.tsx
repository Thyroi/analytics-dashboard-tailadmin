"use client";

import DonutSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DonutSection";
import DrilldownMultiLineSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DrilldownMultiLineSection";
import type { UrlSeries } from "@/features/analytics/services/drilldown";
import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

/* ===== helpers internos ===== */
function minLen(series: {
  current: SeriesPoint[];
  previous: SeriesPoint[];
}): number {
  return Math.min(series.current.length, series.previous.length);
}

function formatAxisForDisplay(g: Granularity, labels: string[]): string[] {
  if (g === "y") {
    // "YYYY-MM" -> "MM-YY"
    return labels.map((ym) => {
      if (!/^\d{4}-\d{2}$/.test(ym)) return ym;
      const mm = ym.slice(5, 7);
      const yy = ym.slice(2, 4);
      return `${mm}-${yy}`;
    });
  }
  // d / w / m: "YYYY-MM-DD" -> "D"
  return labels.map((d) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dd = d.slice(8, 10);
    return String(Number(dd)); // sin cero a la izquierda
  });
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
  /** Mapa de colores por nombre de serie para consistencia visual */
  colorsByName?: Record<string, string>;
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
            colorsByName={props.colorsByName}
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
  const cats = formatAxisForDisplay(granularity, rawCats.slice(-n));
  const curr = series.current.slice(-n).map((p) => p.value);
  const prev = series.previous.slice(-n).map((p) => p.value);

  return <ChartSection categories={cats} currData={curr} prevData={prev} />;
}
