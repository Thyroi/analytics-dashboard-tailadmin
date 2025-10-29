"use client";

import GroupedBarChart, {
  type GroupedBarSeries,
} from "@/components/charts/GroupedBarChart";
import DonutSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DonutSection";
import DrilldownMultiLineSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DrilldownMultiLineSection";
import type { UrlSeries } from "@/features/analytics/services/drilldown";
import ChartSection from "@/features/home/sectors/SectorExpandedCard/ChartSection";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { formatChartLabelsSimple } from "@/lib/utils/charts/labelFormatting";
import { getSeriesLabels } from "@/lib/utils/charts/tooltipLabels";

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
 *  - Izquierda: (Line | MultiLine | GroupedBar)
 *  - Derecha : DonutSection
 */
export default function ChartPair(props: Props) {
  // Si es modo multi con granularidad día, convertir a grouped bar
  const shouldUseGroupedBar =
    props.mode === "multi" && props.granularity === "d";

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
          shouldUseGroupedBar ? (
            <MultiAsGroupedBar
              seriesBySub={props.seriesBySub}
              loading={props.loading}
            />
          ) : (
            <div className="w-full h-full">
              <DrilldownMultiLineSection
                xLabels={props.xLabels}
                seriesBySub={props.seriesBySub}
                loading={props.loading}
                colorsByName={props.colorsByName}
                granularity={props.granularity}
              />
            </div>
          )
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
  // ✅ Para granularidad "d": GroupedBarChart con 1 fecha, 2 barras (current vs previous)
  if (granularity === "d") {
    // Tomar SOLO el último punto (ayer)
    const lastCurrent = series.current[series.current.length - 1];
    const lastPrevious = series.previous[series.previous.length - 1];

    // Si no hay datos current, mostrar skeleton de carga
    if (!lastCurrent) {
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

    // Obtener labels dinámicas según granularidad
    const labels = getSeriesLabels(granularity);

    const categories = [lastCurrent.label]; // ["26 oct"]

    // SIEMPRE mostrar ambas barras: previous (puede ser 0) y current
    const groupedSeries: GroupedBarSeries[] = [
      { name: labels.previous, data: [lastPrevious?.value ?? 0] }, // ✅ Previous (0 si no hay datos)
      { name: labels.current, data: [lastCurrent.value] }, // ✅ Current
    ];

    return (
      <div className="w-full h-full">
        <GroupedBarChart
          title="Comparación diaria"
          subtitle="Ayer vs Anteayer"
          categories={categories}
          series={groupedSeries}
          height={350}
          showLegend={true}
          legendPosition="bottom"
          tooltipFormatter={(val) => (val ?? 0).toLocaleString()}
          yAxisFormatter={(val) => (val ?? 0).toString()}
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
  // Si los labels ya están formateados (no son ISO), usarlos directamente
  const firstLabel = rawCats[0] || "";
  const isAlreadyFormatted =
    firstLabel.length > 0 && !firstLabel.match(/^\d{4}-\d{2}(-\d{2})?$/); // No es formato ISO YYYY-MM-DD ni YYYY-MM

  const cats = isAlreadyFormatted
    ? rawCats.slice(-n) // Ya formateados por buildAxisFromChatbot
    : formatChartLabelsSimple(rawCats.slice(-n), granularity); // Formatear para analytics

  const curr = series.current.slice(-n).map((p) => p.value);
  const prev = series.previous.slice(-n).map((p) => p.value);

  return (
    <div className="w-full h-full">
      <ChartSection
        categories={cats}
        currData={curr}
        prevData={prev}
        granularity={granularity}
      />
    </div>
  );
}

/* ===== left side (grouped bar) ===== */
function MultiAsGroupedBar({
  seriesBySub,
  loading = false,
}: {
  seriesBySub: UrlSeries[];
  loading?: boolean;
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

  // Convertir seriesBySub a formato GroupedBar
  // Cada URL es una categoría, y solo tomamos el último valor (día actual)
  const categories = seriesBySub.map((s) => s.name);
  const values = seriesBySub.map((s) => {
    // Tomar el último valor de la serie (día actual)
    const lastValue = s.data[s.data.length - 1];
    return lastValue || 0;
  });

  const groupedSeries: GroupedBarSeries[] = [
    {
      name: "Interacciones",
      data: values,
    },
  ];

  return (
    <GroupedBarChart
      title="Sub-actividades (comparativa por URL)"
      subtitle="Interacciones en el día seleccionado"
      categories={categories}
      series={groupedSeries}
      height={350}
      showLegend={false}
      legendPosition="bottom"
      tooltipFormatter={(val) => (val ?? 0).toLocaleString()}
      yAxisFormatter={(val) => (val ?? 0).toString()}
    />
  );
}

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
