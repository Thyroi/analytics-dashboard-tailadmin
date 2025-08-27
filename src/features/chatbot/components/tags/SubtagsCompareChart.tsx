"use client";

import * as React from "react";
import LineChart from "@/components/charts/LineChart";
import { SERIES } from "@/lib/mockData";
import {
  buildTrendForTags,
  buildTrendForTagsFromDates,
  type Granularity,
} from "@/lib/chatbot/tags";
import {
  generateDistinctColors,
  makeDayTickFormatter,
  makeWeekTickFormatter,
  makeMonthTickFormatter,
} from "@/lib/chatbot/trendUtils";

/* ===== Tipos ===== */
export type SubtagRow = {
  key: string;
  label: string;
  total: number;
};

type Props = {
  rows: SubtagRow[];
  gran: Granularity;
  colorsByLabel?: Record<string, string>;
  height?: number;
  maxSeries?: number;
  title?: string;
  subtitle?: string;
  /** Fechas diarias exactas de la ventana (para alinear 1:1 con lista/donut). */
  windowDates?: string[];
};

export default function SubtagsCompareChart({
  rows,
  gran,
  colorsByLabel,
  height = 320,
  maxSeries = 6,
  title = "Comparativa de subtags (líneas)",
  subtitle = "Tendencia por subtag",
  windowDates,
}: Props) {
  const selected = React.useMemo(() => rows.slice(0, maxSeries), [rows, maxSeries]);
  const keys = React.useMemo(() => selected.map((r) => r.key), [selected]);

  // Trend: usar exactamente la ventana si viene; si no, fallback.
  const trend = React.useMemo(
    () =>
      windowDates && windowDates.length > 0
        ? buildTrendForTagsFromDates(SERIES, keys, windowDates, gran)
        : buildTrendForTags(SERIES, keys, gran),
    [keys, gran, windowDates]
  );

  const labelByKey = React.useMemo(() => {
    const map: Record<string, string> = {};
    selected.forEach((r) => (map[r.key] = r.label));
    return map;
  }, [selected]);

  const prettySeries = React.useMemo(
    () => trend.series.map((s) => ({ name: labelByKey[s.name] ?? s.name, data: s.data })),
    [trend.series, labelByKey]
  );

  const internalColorsByName = React.useMemo(() => {
    if (colorsByLabel) return colorsByLabel;
    const labels = prettySeries.map((s) => s.name);
    return generateDistinctColors(labels);
  }, [colorsByLabel, prettySeries]);

  // ===== NUEVO: formatters de eje X según granularidad =====
  const xLabelFormatter = React.useMemo(() => {
    if (gran === "day")   return makeDayTickFormatter(trend.categories);
    if (gran === "week")  return makeWeekTickFormatter();
    return makeMonthTickFormatter();
  }, [gran, trend.categories]);

  return (
    <div className="bg-white dark:bg-[#14181e] p-4">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
      </div>

      <LineChart
        type="area"
        smooth
        categories={trend.categories}
        series={prettySeries}
        height={height}
        showLegend
        legendPosition="bottom"
        colorsByName={internalColorsByName}
        optionsExtra={{
          xaxis: { labels: { formatter: xLabelFormatter } },
          fill: { type: "gradient", gradient: { opacityFrom: 0.45, opacityTo: 0 } },
        }}
      />
    </div>
  );
}
