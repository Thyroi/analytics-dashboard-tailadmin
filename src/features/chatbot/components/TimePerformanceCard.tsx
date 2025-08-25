"use client";

import BarChart from "@/components/charts/BarChart";
import KPICard from "@/components/dashboard/KPICard";
import TimePerformanceCardSkeleton from "@/components/skeletons/TimePerformanceCardSkeleton";
import { useEffect, useMemo, useRef, useState } from "react";
import GranularityTabs from "./GranularityTabs";

import {
  type Bucket,
  bucketize,
  comparePrevious,
  computeKpis,
  type DailyDatum,
  type Granularity,
  inferRangeFromDaily,
  sortDaily,
} from "@/lib/chatbot/time";

import DailyStackedTop5 from "@/features/chatbot/components/DailyStackedTop5";
import type { SeriesByTag } from "@/lib/chatbot/stackTop5";

const CARD_BG_DARK = "dark:bg-[#14181e]";
const fmt = (n: number) => Intl.NumberFormat().format(Math.round(n));

type StackedCfg = {
  seriesByTag: SeriesByTag;
  days?: number;
  colorsByTag?: Record<string, string>;
  stackedHeight?: number;
  titleOverride?: string;
  subtitleOverride?: string;
};

export default function TimePerformanceCard({
  title,
  data,
  range,
  initialGranularity = "day",
  showCompare = true,
  numberFormat = fmt,
  minHeight = 520,
  chartHeight = 320,
  onBarClick,
  className = "",
  isLoading = false,
  stackedDailyTop5,
}: {
  title: string;
  data: DailyDatum[];
  range?: { start: string; end: string };
  initialGranularity?: Granularity;
  showCompare?: boolean;
  numberFormat?: (n: number) => string;
  minHeight?: number;
  chartHeight?: number;
  onBarClick?: (b: Bucket & { granularity: Granularity }) => void;
  className?: string;
  isLoading?: boolean;
  stackedDailyTop5?: StackedCfg;
}) {
  const [gran, setGran] = useState<Granularity>(initialGranularity);

  const sorted = useMemo(() => sortDaily(data), [data]);
  const resolvedRange = useMemo(
    () => range ?? inferRangeFromDaily(sorted),
    [range, sorted]
  );
  const buckets = useMemo(
    () => bucketize(sorted, gran, resolvedRange),
    [sorted, gran, resolvedRange]
  );

  const { total, avg, peak } = useMemo(() => computeKpis(buckets), [buckets]);
  const compare = useMemo(
    () => (showCompare ? comparePrevious(buckets, gran, sorted) : null),
    [buckets, gran, sorted, showCompare]
  );

  const categories = useMemo(() => buckets.map((b) => b.key), [buckets]);
  const series = useMemo(
    () => [{ name: "Total", data: buckets.map((b) => b.value) }],
    [buckets]
  );

  // Forzar 1 columna si alguna KPI cae por debajo del umbral (opcional)
  const kpiGridRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const grid = kpiGridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>(".kpi-card"));
    if (cards.length === 0) return;

    const update = () => {
      const tooSmall = cards.some((el) => {
        const { width, height } = el.getBoundingClientRect();
        return width < 120 || height < 175;
      });
      grid.classList.toggle("kpi-grid--one", tooSmall);
      grid.classList.toggle("kpi-grid--auto", !tooSmall);
    };

    const ro = new ResizeObserver(update);
    cards.forEach((el) => ro.observe(el));
    ro.observe(grid);
    update();
    return () => ro.disconnect();
  }, []);

  if (isLoading) {
    return (
      <TimePerformanceCardSkeleton height={chartHeight} className={className} />
    );
  }

  const avgTitle =
    gran === "day"
      ? "Promedio por día"
      : gran === "week"
      ? "Promedio por semana"
      : "Promedio por mes";

  return (
    <div
      className={`
        rounded-2xl shadow-sm border border-gray-200 dark:border-white/10
        bg-white ${CARD_BG_DARK}
        grid grid-rows-[auto_auto_auto]
        overflow-hidden
        min-h-[${minHeight}px]
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 dark:border-white/10 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {title}
        </h3>
        <div className="shrink-0">
          <GranularityTabs value={gran} onChange={setGran} />
        </div>
      </div>

      {/* KPIs */}
      <div
        ref={kpiGridRef}
        className="kpi-grid kpi-grid--auto px-5 py-3 min-w-0"
      >
        <div className="min-w-0">
          <KPICard
            title={avgTitle}
            value={numberFormat(avg)}
            delta={
              compare
                ? `${compare.pct >= 0 ? "+" : ""}${compare.pct.toFixed(2)}%`
                : "—"
            }
            deltaVariant={compare && compare.pct < 0 ? "down" : "up"}
            className="h-full"
          />
        </div>

        <div className="min-w-0">
          <KPICard
            title="Total"
            value={numberFormat(total)}
            delta=" "
            className="h-full"
          />
        </div>

        <div className="min-w-0">
          <KPICard
            title="Pico"
            value={numberFormat(peak.value)}
            delta={peak.key}
            className="h-full"
          />
        </div>
      </div>

      {/* Chart */}
      <div className="px-5 pb-5 min-w-0">
        <div className="w-full overflow-hidden">
          {gran === "day" && stackedDailyTop5 ? (
            <DailyStackedTop5
              className="w-full !bg-transparent !border-0 !shadow-none !p-0"
              seriesByTag={stackedDailyTop5.seriesByTag}
              days={stackedDailyTop5.days ?? 7}
              height={stackedDailyTop5.stackedHeight ?? chartHeight}
              colorsByTag={stackedDailyTop5.colorsByTag}
              title={
                stackedDailyTop5.titleOverride ??
                "Top-5 por día (última semana)"
              }
              subtitle={
                stackedDailyTop5.subtitleOverride ??
                "Barras apiladas por tag raíz"
              }
            />
          ) : buckets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 dark:border-white/10 p-6 text-sm text-gray-500 dark:text-gray-400 w-full text-center">
              Sin datos en el rango.
            </div>
          ) : (
            <BarChart
              className="w-full"
              categories={categories}
              series={series}
              height={chartHeight}
              optionsExtra={{
                tooltip: { y: { formatter: (v: number) => numberFormat(v) } },
                plotOptions: { bar: { borderRadius: 6 } },
                xaxis: { labels: { rotate: -30 } },
              }}
              // @ts-expect-error: firma específica del wrapper
              onBarClick={(idx: number) => {
                const b = buckets[idx];
                if (!b || !onBarClick) return;
                onBarClick({ ...b, granularity: gran });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
