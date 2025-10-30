import type { SeriesPoint } from "@/lib/types";
import type { ApexOptions } from "apexcharts";

export type ComparisonSeries = {
  current: SeriesPoint[];
  previous: SeriesPoint[];
};

export type ComparisonBarChartProps = {
  /** Series con datos current y previous */
  series: ComparisonSeries;
  /** Título del chart */
  title?: string;
  /** Subtítulo del chart */
  subtitle?: string;
  /** Altura del chart */
  height?: number | string;
  /** Mostrar leyenda */
  showLegend?: boolean;
  /** Formatter personalizado para tooltips */
  tooltipFormatter?: (value: number) => string;
  /** Formatter para eje Y */
  yAxisFormatter?: (value: number) => string;
  /** Clases CSS adicionales */
  className?: string;
  /** Granularidad para formateo de labels */
  granularity?: "d" | "w" | "m" | "y";
  /** Opciones adicionales de ApexCharts */
  optionsExtra?: ApexOptions;
};

export const DEFAULT_HEIGHT = 350;
export const DEFAULT_TITLE = "Comparación de períodos";
