import type { GroupedBarSeries } from "@/components/charts/GroupedBarChart";
import type { UrlSeries } from "@/features/analytics/services/drilldown";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

export type Base = {
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

export type LineChartMode = Base & {
  mode: "line";
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
};

export type MultiLineMode = Base & {
  mode: "multi";
  /** Eje X y series por sub-actividad (URL) */
  xLabels: string[];
  seriesBySub: UrlSeries[];
  loading?: boolean;
  /** Mapa de colores por nombre de serie para consistencia visual */
  colorsByName?: Record<string, string>;
};

export type GroupedBarMode = Base & {
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

export type ChartPairProps = LineChartMode | MultiLineMode | GroupedBarMode;
