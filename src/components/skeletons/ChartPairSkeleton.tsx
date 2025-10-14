"use client";

import ChartSectionSkeleton from "@/features/analytics/skeletons/ChartSectionSkeleton";
import DonutSectionSkeleton from "@/features/analytics/skeletons/DonutSectionSkeleton";

type Props = {
  /** Alto del chart izquierdo */
  chartHeight?: number;
  /** Alto del donut derecho */
  donutHeight?: number;
  /** Cantidad de filas fantasma en la leyenda del donut */
  legendItems?: number;
  /** Mostrar el pill de acción en el donut */
  showActionPill?: boolean;
  /** Clase CSS adicional para el contenedor */
  className?: string;
};

/**
 * Skeleton para ChartPair - simula el layout de 2 columnas:
 * - Izquierda: Chart skeleton (line o multi-line)
 * - Derecha: Donut skeleton
 */
export default function ChartPairSkeleton({
  chartHeight = 320,
  donutHeight = 180,
  legendItems = 6,
  showActionPill = true,
  className = "",
}: Props) {
  return (
    <div
      className={`grid grid-cols-1 xl:grid-cols-2 gap-4 ${className}`}
      aria-busy="true"
    >
      {/* Columna izquierda - Chart */}
      <div>
        <ChartSectionSkeleton height={chartHeight} />
      </div>

      {/* Columna derecha - Donut */}
      <div>
        <DonutSectionSkeleton
          height={donutHeight}
          legendItems={legendItems}
          showActionPill={showActionPill}
        />
      </div>
    </div>
  );
}
