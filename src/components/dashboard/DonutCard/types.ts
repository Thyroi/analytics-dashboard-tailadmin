import type { LucideIcon } from "lucide-react";

export type DonutCardItem = {
  label: string;
  value: number;
  color?: string;
};

export type DonutCardProps = {
  items: DonutCardItem[];
  onSliceClick?: (label: string) => void;

  /** Encabezado (usa <Header/>) */
  title: string;
  subtitle?: string;
  Icon?: LucideIcon;
  iconColor?: string;
  titleSize?: "xxs" | "xs" | "s" | "sm" | "md" | "lg";
  titleClassName?: string;
  subtitleColor?: string;

  /** Texto inferior del centro del donut (ej. "Total") */
  centerTitle?: string;
  /** Si lo pasas, usa este valor en el centro; si no, suma de `items` */
  centerValueOverride?: number;

  /** Link/target del botón de acción (opcional) */
  actionHref?: string;

  /** Altura del gráfico */
  height?: number;

  /** Columnas de la leyenda en modo interactivo/estático */
  legendColumns?: 1 | 2;

  /** Apariencia del contenedor interno */
  variant?: "card" | "plain";

  /** Estado vacío (muestra donut 100% + ícono centrado) */
  emptyIcon?: LucideIcon;
  emptyLabel?: string;
  emptyColor?: string;

  className?: string;
};

export type ApexDataPointSelectionCfg = {
  dataPointIndex: number;
  w: { globals: { labels: string[] } };
};
