export type DonutDatum = {
  label: string;
  value: number;
  color?: string;
};

export interface DonutLeaderProps {
  data: DonutDatum[];
  /** Altura del gráfico (px o "100%"). */
  height?: number | string;
  innerRadiusRatio?: number;
  leaderLineLen?: { radial: number; horizontal: number };
  maxSlices?: number;
  labelFormatter?: (d: { label: string; value: number; pct: number }) => string;
  showCenterTotal?: boolean;
  centerTitle?: string;
  totalFormatter?: (total: number) => string;
  palette?: readonly string[];
  className?: string;
  /** Texto */
  labelFontSize?: number; // default: 11
  labelLineHeight?: number; // default: 13
  /** Margen opcional al viewBox (px) para dar aire a los lados */
  padViewBox?: number; // default: 0
  /** Callback opcional al hacer click en un sector (ignora "Otros") */
  onSliceClick?: (d: DonutDatum, meta: { index: number }) => void;
}

export type DonutItem = DonutDatum & {
  color: string;
  __i?: number; // índice original en data
  __isOthers?: boolean; // marca si es el agregado "Otros"
  __others?: number[]; // índices incluidos en "Otros"
};

export interface DonutSegment {
  data: DonutItem;
  start: number;
  end: number;
  mid: number;
  pct: number;
}

export interface DonutLabel {
  id: number;
  color: string;
  path: string;
  textX: number;
  textY: number;
  textAnchor: "start" | "end";
  lines: string[];
}

export const DEFAULT_PALETTE = [
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#A855F7",
  "#EF4444",
  "#10B981",
  "#60A5FA",
  "#F472B6",
] as const;
