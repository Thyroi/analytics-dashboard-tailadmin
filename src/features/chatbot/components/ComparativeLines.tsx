"use client";

import LineChart, { type LineSeries } from "@/components/charts/LineChart";
import { scaleHeat } from "@/lib/analytics/utils";

export type Column = { key: string; label: string };
export type TrendPoint = { date: string; value: number };

type Props = {
  /** Subtags seleccionados (keys = tagPath) */
  columns: Column[];
  /** Fechas/buckets en orden ascendente (YYYY-MM-DD) */
  categories: string[];
  /** Series por key (cada serie es [{ date, value }]) */
  seriesByKey: Record<string, TrendPoint[]>;
  height?: number;
  smooth?: boolean;
  type?: "line" | "area";
};

export default function ComparativeLines({
  columns,
  categories,
  seriesByKey,
  height = 360,
  smooth = true,
  type = "line",
}: Props) {
  // Totales por subtag para calcular color térmico consistente
  const totals = columns.map((c) =>
    (seriesByKey[c.key] ?? []).reduce((acc, p) => acc + p.value, 0)
  );
  const max = Math.max(1, ...totals);
  const min = Math.min(...totals);

  // Mapa de colores por nombre de serie (label)
  const colorsByName: Record<string, string> = Object.fromEntries(
    columns.map((c, i) => [c.label, scaleHeat(totals[i], min, max)])
  );

  // Transformar a la API de tu LineChart: [{ name, data }]
  const series: LineSeries[] = columns.map((c) => ({
    name: c.label,
    data: categories.map(
      (d) => seriesByKey[c.key]?.find((p) => p.date === d)?.value ?? 0
    ),
  }));

  return (
    <LineChart
      categories={categories}
      series={series}
      height={height}
      smooth={smooth}
      type={type}
      colorsByName={colorsByName}
      showLegend
      legendPosition="bottom"
    />
  );
}
