import type { ApexOptions } from "apexcharts";

export type PieDatum = {
  label: string;
  value: number;
};

export type DataLabelMode = "percent" | "value" | "none";
export type LabelPosition = "inside" | "outside";

export type PieChartProps = {
  /** Datos para mostrar */
  data: PieDatum[];
  /** Tipo de gráfico */
  type?: "pie" | "donut";
  /** Altura del gráfico */
  height?: number;

  /** Paleta de colores personalizada */
  palette?: string[];
  /** Colores específicos por label */
  colorsByLabel?: Record<string, string>;

  /** Mostrar leyenda */
  showLegend?: boolean;
  /** Posición de la leyenda */
  legendPosition?: "bottom" | "top" | "right" | "left";

  /** Formato de data labels */
  dataLabels?: DataLabelMode;
  /** Posición de labels */
  labelPosition?: LabelPosition;

  /** Label para el total del donut */
  donutTotalLabel?: string;
  /** Formatter personalizado para el total */
  donutTotalFormatter?: (total: number) => string;

  /** Opciones extra de ApexCharts */
  optionsExtra?: ApexOptions;
  /** Clases CSS adicionales */
  className?: string;

  /** Modo hover compacto */
  compactHover?: boolean;

  /** Overlay centrado personalizado */
  centerTop?: string;
  centerBottom?: string;

  /** Estado vacío */
  emptyIcon?: React.ReactNode;
  emptyText?: string;
};

export const DEFAULT_HEIGHT = 300;
export const DEFAULT_EMPTY_TEXT = "Sin datos para mostrar.";
