import type { ApexOptions } from "apexcharts";

export type LineSeries = { name: string; data: number[] };

export type LineChartProps = {
  categories: string[];
  series: LineSeries[];
  type?: "line" | "area";
  height?: number | string;
  palette?: readonly string[];
  colorsByName?: Record<string, string>;
  showLegend?: boolean;
  legendPosition?: "bottom" | "top" | "right" | "left";
  smooth?: boolean;
  optionsExtra?: ApexOptions;
  className?: string;
  /** Relleno degradado de marca para gráficos de área */
  brandAreaGradient?: boolean;
};
