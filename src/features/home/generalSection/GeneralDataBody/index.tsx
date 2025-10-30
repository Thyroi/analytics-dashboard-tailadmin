"use client";

import type { Granularity, KPISeries } from "@/lib/types";
import { WRAPPER_CLASSES } from "./constants";
import { DailyChart } from "./DailyChart";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { useChartData } from "./useChartData";
import { useSeriesLabels } from "./useSeriesLabels";

type Props = {
  mode: "granularity" | "range";
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  onClearRange: () => void;
  kpiSeries: KPISeries; // { bucket, current, previous }
  className?: string;
};

export default function GeneralDataBody({
  kpiSeries,
  granularity,
  className = "",
}: Props) {
  const { categories, currData, prevData } = useChartData(
    kpiSeries,
    granularity
  );

  // Obtener labels según granularidad
  const seriesLabels = useSeriesLabels(granularity);

  // Para granularidad 'd': usar GroupedBarChart para comparar día actual vs anterior
  if (granularity === "d") {
    return (
      <div className={`${WRAPPER_CLASSES} ${className}`}>
        <DailyChart
          categories={categories}
          currData={currData}
          prevData={prevData}
          currentLabel={seriesLabels.current}
          previousLabel={seriesLabels.previous}
        />
      </div>
    );
  }

  // Para otras granularidades: mantener LineChart
  return (
    <div className={`${WRAPPER_CLASSES} ${className}`}>
      <TimeSeriesChart
        categories={categories}
        currData={currData}
        prevData={prevData}
        currentLabel={seriesLabels.current}
        previousLabel={seriesLabels.previous}
      />
    </div>
  );
}
