"use client";

import * as React from "react";
import { fetchTopPages } from "../services/topPages";
import type { ISODate, TopPagesResponse, SeriesItem, TopPageItem } from "../types";
import {
  generateDistinctColors,
  buildDonutOptions,
  type DonutOptions,
} from "@/lib/chatbot/trendUtils";
import LineChart from "@/components/charts/LineChart";
import PieChart, { type PieDatum } from "@/components/charts/PieChart";
import Header from "@/components/common/Header";
import MetricList, { type MetricListItem } from "@/components/common/MetricList";
import TopPagesCardSkeleton from "@/components/skeletons/TopPagesCardSkeleton";
import DateRangePicker from "@/components/common/DateRangePicker";

/* ===== Helpers de fechas (UTC) ===== */
function toISODateUTC(d: Date): ISODate {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}` as ISODate;
}
function parseISODateUTC(iso: ISODate): Date {
  return new Date(`${iso}T00:00:00Z`);
}
function defaultLastNDays(n: number): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (n - 1));
  return { start, end };
}

type Props = {
  start?: ISODate;
  end?: ISODate;
  limit?: number;
  title?: string;
  subtitle?: string;
};

export default function TopPagesSection({
  start,
  end,
  limit = 5,
  title = "Top pages",
  subtitle = "Most viewed pages in the selected range",
}: Props) {
  const initial = React.useMemo(() => {
    if (start && end) return { start: parseISODateUTC(start), end: parseISODateUTC(end) };
    return defaultLastNDays(30);
  }, [start, end]);

  const [rangeStart, setRangeStart] = React.useState<Date>(initial.start);
  const [rangeEnd, setRangeEnd] = React.useState<Date>(initial.end);

  const isoStart: ISODate = React.useMemo(() => toISODateUTC(rangeStart), [rangeStart]);
  const isoEnd: ISODate = React.useMemo(() => toISODateUTC(rangeEnd), [rangeEnd]);

  const [data, setData] = React.useState<TopPagesResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetchTopPages({ start: isoStart, end: isoEnd, limit, signal: ctrl.signal })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [isoStart, isoEnd, limit]);

  const seriesNames = React.useMemo(() => {
    const series = (data?.trend.series ?? []) as SeriesItem[];
    return series.map((s) => s.name);
  }, [data?.trend.series]);

  const colorsByName = React.useMemo(
    () => generateDistinctColors(seriesNames),
    [seriesNames]
  );

  const donutData: PieDatum[] = React.useMemo(() => {
    const pages = (data?.summary.pages ?? []) as TopPageItem[];
    const total = data?.summary.totalViews ?? 0;
    const topSlices = pages.map((p) => ({
      label: p.title ?? p.path,
      value: p.views,
    }));
    const sumTop = topSlices.reduce((a, s) => a + s.value, 0);
    const other = Math.max(0, total - sumTop);
    return other > 0 ? [...topSlices, { label: "Other", value: other }] : topSlices;
  }, [data?.summary.pages, data?.summary.totalViews]);

  const donutColorsByLabel = React.useMemo(() => {
    const map: Record<string, string> = {};
    donutData.forEach((d) => {
      map[d.label] = colorsByName[d.label] ?? (d.label === "Other" ? "#9CA3AF" : "#9CA3AF");
    });
    return map;
  }, [donutData, colorsByName]);

  const donutOptionsBase: DonutOptions = React.useMemo(
    () => buildDonutOptions((v) => Intl.NumberFormat().format(v), "Total", "68%"),
    []
  );

  const donutOptions: DonutOptions = React.useMemo(() => {
    const total = data?.summary.totalViews ?? 0;
    const pctFormatter = (raw: string) => {
      const n = Number(raw || 0);
      const pct = total > 0 ? Math.round((n / total) * 100) : 0;
      return `${pct}%`;
    };
    return {
      plotOptions: {
        pie: {
          expandOnClick: donutOptionsBase.plotOptions.pie.expandOnClick,
          donut: {
            size: donutOptionsBase.plotOptions.pie.donut.size,
            labels: {
              show: true,
              name: { ...donutOptionsBase.plotOptions.pie.donut.labels.name },
              value: { ...donutOptionsBase.plotOptions.pie.donut.labels.value, formatter: pctFormatter },
              total: { ...donutOptionsBase.plotOptions.pie.donut.labels.total, show: false },
            },
          },
        },
      },
      tooltip: donutOptionsBase.tooltip,
    };
  }, [donutOptionsBase, data?.summary.totalViews]);

  const listItems: MetricListItem[] = React.useMemo(() => {
    const pages = (data?.summary.pages ?? []) as TopPageItem[];
    return pages.map((p, idx) => {
      const name = p.title ?? p.path;
      return {
        id: `${p.path}::${idx}`,
        label: name,
        title: name,
        value: p.views,
        color: colorsByName[name] ?? "#9CA3AF",
        href: p.path.startsWith("/") ? p.path : undefined,
      };
    });
  }, [data?.summary.pages, colorsByName]);

  if (loading) return <TopPagesCardSkeleton donutSize={220} chartHeight={320} rows={6} />;
  if (error)
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-50/10 p-4 text-red-600">
        Error: {error}
      </div>
    );
  if (!data) return null;

  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#14181e] p-8">
        {/* fila superior: título + datepicker */}
        <div className="flex items-start justify-between px-9">
          <Header title={title} subtitle={subtitle} />
          <DateRangePicker
            startDate={rangeStart}
            endDate={rangeEnd}
            onRangeChange={(startD, endD) => {
              const s = new Date(Date.UTC(startD.getUTCFullYear(), startD.getUTCMonth(), startD.getUTCDate()));
              const e = new Date(Date.UTC(endD.getUTCFullYear(), endD.getUTCMonth(), endD.getUTCDate()));
              setRangeStart(s);
              setRangeEnd(e);
            }}
          />
        </div>

        {/* fila inferior: 3 columnas alineadas arriba */}
        <div className="p-4 pl-10">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            {/* izquierda: lista (sin mt para alinear top) */}
            <div className="xl:col-span-3 flex flex-col">
              <MetricList
                className="flex-1"
                title="Pages"
                totalLabel="Total views"
                totalValue={data.summary.totalViews}
                items={listItems}
              />
            </div>

            {/* centro: donut (sin items-center para no centrar vertical) */}
            <div className="xl:col-span-3 flex justify-center items-start">
              {donutData.length ? (
                <PieChart
                  type="donut"
                  data={donutData}
                  height={260}
                  colorsByLabel={donutColorsByLabel}
                  showLegend={false}
                  dataLabels="none"
                  donutTotalLabel="Total"
                  donutTotalFormatter={(t) => Intl.NumberFormat().format(t)}
                  optionsExtra={donutOptions}
                />
              ) : (
                <div className="text-sm text-gray-400">Sin datos</div>
              )}
            </div>

            {/* derecha: líneas */}
            <div className="xl:col-span-6 flex flex-col">
              <LineChart
                type="area"
                smooth
                categories={data.trend.categories}
                series={data.trend.series}
                height={320}
                showLegend
                legendPosition="bottom"
                colorsByName={colorsByName}
                optionsExtra={{
                  xaxis: { type: "category", categories: data.trend.categories },
                  fill: { type: "gradient", gradient: { opacityFrom: 0.45, opacityTo: 0 } },
                  tooltip: { y: { formatter: (v: number) => Intl.NumberFormat().format(v) } },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
