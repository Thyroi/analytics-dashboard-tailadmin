"use client";

import type { KPIColumnWithTrendProps } from "./types";
import { DEFAULT_TITLE, GRID_LAYOUT } from "./constants";
import { useKPIItems } from "./useKPIItems";
import { useChartData } from "./useChartData";
import { KPIColumn } from "./KPIColumn";
import { TrendChart } from "./TrendChart";

/** KPIs en columna a la izquierda + line chart a la derecha */
export default function KPIColumnWithTrend({
  series,
  kpis,
  loading = false,
  error = null,
  title = DEFAULT_TITLE,
  className = "",
}: KPIColumnWithTrendProps) {
  const items = useKPIItems(kpis);
  const { categories, currData, prevData } = useChartData(series);

  return (
    <div
      className={`grid ${GRID_LAYOUT.gap} ${GRID_LAYOUT.itemsAlign} ${className}`}
      style={{ gridTemplateColumns: GRID_LAYOUT.columns }}
    >
      {/* Columna izquierda: KPIs en vertical */}
      <KPIColumn loading={loading} items={items} error={error} />

      {/* Columna derecha: gráfico de líneas */}
      <TrendChart
        title={title}
        categories={categories}
        currData={currData}
        prevData={prevData}
      />
    </div>
  );
}

export type { KPIsForUrl } from "./types";
