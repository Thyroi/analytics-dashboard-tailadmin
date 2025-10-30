import type { ApexOptions } from "apexcharts";

export type GroupedBarSeries = {
  name: string;
  data: number[];
  color?: string; // Color específico para esta serie
};

export type GroupedBarChartProps = {
  /** Etiquetas del eje X (ej: meses, categorías, etc.) */
  categories: string[];
  /** Series de datos para comparar */
  series: GroupedBarSeries[];
  /** Alto del gráfico */
  height?: number | string;
  /** Clases CSS adicionales */
  className?: string;
  /** Título opcional */
  title?: string;
  /** Subtítulo opcional (ej: "Total number of deliveries 70.5K") */
  subtitle?: string;
  /** Mostrar leyenda */
  showLegend?: boolean;
  /** Posición de la leyenda (top | bottom) */
  legendPosition?: "top" | "bottom";
  /** Colores por defecto si no se especifican en series */
  defaultColors?: string[];
  /** Formato personalizado para tooltips */
  tooltipFormatter?: (val: number) => string;
  /** Formato para labels del eje Y */
  yAxisFormatter?: (val: number) => string;
  /** Opciones adicionales de ApexCharts */
  optionsExtra?: ApexOptions;
};

export const DEFAULT_HEIGHT = 350;
