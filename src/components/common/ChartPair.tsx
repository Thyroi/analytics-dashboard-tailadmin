"use client";

import ComparisonBarChart from "@/components/charts/ComparisonBarChart";
import GroupedBarChart, {
  type GroupedBarSeries,
} from "@/components/charts/GroupedBarChart";
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
  /** Mapa de colores por nombre de serie para consistencia visual */
  colorsByName?: Record<string, string>;
};

type GroupedBarMode = Base & {
  mode: "grouped";
  /** Categorías del eje X para el grouped bar chart */
  categories: string[];
  /** Series de datos agrupados */
  groupedSeries: GroupedBarSeries[];
  /** Título del gráfico */
  chartTitle?: string;
  /** Subtítulo del gráfico */
  chartSubtitle?: string;
  /** Altura del gráfico */
  chartHeight?: number;
  /** Formato de tooltips */
  tooltipFormatter?: (val: number) => string;
  /** Formato del eje Y */
  yAxisFormatter?: (val: number) => string;
  loading?: boolean;
  /** Posición de la leyenda del gráfico */
  legendPosition?: "top" | "bottom";
};

type Props = LineChartMode | MultiLineMode | GroupedBarMode;

/**
 * Layout 2 columnas:
 *  - Izquierda: (Line | MultiLine)
 *  - Derecha : DonutSection
 */
export default function ChartPair(props: Props) {
  return (
    <div
      className={`grid grid-cols-1 xl:grid-cols-2 gap-4 xl:items-stretch w-full ${
        props.className ?? ""
      }`}
    >
      <div className="flex w-full">
        {props.mode === "line" ? (
          <LineSide series={props.series} granularity={props.granularity} />
        ) : props.mode === "multi" ? (
          <div className="w-full h-full">
            <DrilldownMultiLineSection
              xLabels={props.xLabels}
              seriesBySub={props.seriesBySub}
              loading={props.loading}
              colorsByName={props.colorsByName}
              granularity={props.granularity}
            />
          </div>
        ) : (
          <GroupedBarSide
            categories={props.categories}
            groupedSeries={props.groupedSeries}
            chartTitle={props.chartTitle}
            chartSubtitle={props.chartSubtitle}
            chartHeight={props.chartHeight}
            tooltipFormatter={props.tooltipFormatter}
            yAxisFormatter={props.yAxisFormatter}
            loading={props.loading}
            legendPosition={props.legendPosition}
          />
        )}
      </div>

      <div className="flex w-full">
        <DonutSection
          donutData={props.donutData}
          onSliceClick={props.onDonutSlice}
          centerLabel={props.donutCenterLabel}
          actionButtonTarget={props.actionButtonTarget}
          showActivityButton={props.showActivityButton}
        />
      </div>
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
  // Si es granularidad diaria, usar el gráfico de barras comparativas
  if (granularity === "d") {
    return (
      <div className="w-full h-full">
        <ComparisonBarChart
          series={series}
          title="Comparación diaria"
          subtitle="Periodo anterior vs Periodo actual"
          height={350}
          showLegend={true}
          tooltipFormatter={(value) => value.toLocaleString()}
          yAxisFormatter={(value) => value.toString()}
          granularity={granularity}
        />
      </div>
    );
  }

  // Para otras granularidades, usar el gráfico de líneas original
  // categorías originales desde la serie current (ya viene bucketizada por backend)
  const rawCats = series.current.map((p) => p.label);

  // n efectivo
  const nSeries = minLen(series);
  const n = Math.min(nSeries, rawCats.length);

  // recortes alineados
  const cats = formatChartLabelsSimple(rawCats.slice(-n), granularity);
  const curr = series.current.slice(-n).map((p) => p.value);
  const prev = series.previous.slice(-n).map((p) => p.value);

  return (
    <div className="w-full h-full">
      <ChartSection categories={cats} currData={curr} prevData={prev} />
    </div>
  );
}

/* ===== left side (grouped bar) ===== */
function GroupedBarSide({
  categories,
  groupedSeries,
  chartTitle,
  chartSubtitle,
  chartHeight = 350,
  tooltipFormatter,
  yAxisFormatter,
  loading = false,
  legendPosition = "top",
}: {
  categories: string[];
  groupedSeries: GroupedBarSeries[];
  chartTitle?: string;
  chartSubtitle?: string;
  chartHeight?: number;
  tooltipFormatter?: (val: number) => string;
  yAxisFormatter?: (val: number) => string;
  loading?: boolean;
  legendPosition?: "top" | "bottom";
}) {
  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GroupedBarChart
      title={chartTitle}
      subtitle={chartSubtitle}
      categories={categories}
      series={groupedSeries}
      height={chartHeight}
      showLegend={true}
      legendPosition={legendPosition}
      tooltipFormatter={tooltipFormatter}
      yAxisFormatter={yAxisFormatter}
    />
  );
}
