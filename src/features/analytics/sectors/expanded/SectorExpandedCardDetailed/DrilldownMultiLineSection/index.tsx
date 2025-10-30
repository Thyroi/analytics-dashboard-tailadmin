"use client";

import { ChartContent } from "./ChartContent";
import {
  CONTAINER_CLASSES,
  DEFAULT_EMPTY_HINT,
  DEFAULT_GRANULARITY,
  DEFAULT_HEIGHT,
  DEFAULT_MAX_SERIES,
  DEFAULT_SMOOTH,
  TITLE_CLASSES,
} from "./constants";
import { EmptyState } from "./EmptyState";
import { LoadingState } from "./LoadingState";
import type { DrilldownMultiLineSectionProps } from "./types";
import { useChartSeries } from "./useChartSeries";
import { useFormattedLabels } from "./useFormattedLabels";

export default function DrilldownMultiLineSection({
  xLabels,
  seriesBySub,
  loading = false,
  height = DEFAULT_HEIGHT,
  maxSeries = DEFAULT_MAX_SERIES,
  smooth = DEFAULT_SMOOTH,
  className = "",
  emptyHint = DEFAULT_EMPTY_HINT,
  colorsByName,
  granularity = DEFAULT_GRANULARITY,
}: DrilldownMultiLineSectionProps) {
  const safeX = useFormattedLabels(xLabels, granularity);
  const { chartSeries, hasData } = useChartSeries(
    seriesBySub,
    safeX.length,
    maxSeries
  );

  return (
    <div className={`${CONTAINER_CLASSES} ${className}`}>
      <div className={TITLE_CLASSES}>Sub-actividades (comparativa por URL)</div>

      {loading && <LoadingState height={height} />}

      {!loading && chartSeries.length === 0 && (
        <EmptyState height={height} emptyHint={emptyHint} />
      )}

      {!loading && chartSeries.length > 0 && (
        <ChartContent
          height={height}
          categories={safeX}
          series={chartSeries}
          smooth={smooth}
          colorsByName={colorsByName}
          hasData={hasData}
        />
      )}
    </div>
  );
}

export type { SubSeries } from "./types";
