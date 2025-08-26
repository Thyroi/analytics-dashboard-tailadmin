"use client";

import * as React from "react";
import LineChart from "@/components/charts/LineChart";
import SectionTitle from "@/components/common/SectionTitle";
import { buildTrendForTags } from "@/lib/chatbot/tags";
import { SERIES } from "@/lib/mockData";
import { buildPrevWindowFallback, fmtDateLabel } from "@/lib/chatbot/trendUtils";

export default function TotalSearchesTrendCard({
  visibleTags,
  categories,             // buckets (día/semana/mes) del panel principal
  gran,                   // "day" | "week" | "month"
  title = "Total de búsquedas",
  subtitle = "Último periodo vs. anterior",
  height = 240,
}: {
  visibleTags: string[];
  categories: string[];
  gran: "day" | "week" | "month";
  title?: string;
  subtitle?: string;
  height?: number;
}) {
  // 1) Ventana ACTUAL agregada por bucket
  const ref = React.useMemo(
    () => buildTrendForTags(SERIES, visibleTags, gran),
    [visibleTags, gran]
  );

  // Suma vertical por bucket, alineada a `categories`
  const currentData = React.useMemo(() => {
    const idx = new Map(ref.categories.map((c, i) => [c, i]));
    return categories.map((c) =>
      ref.series.reduce((acc, s) => acc + (s.data[idx.get(c) ?? -1] ?? 0), 0)
    );
  }, [ref, categories]);

  // 2) Ventana ANTERIOR (intenta desde ref, si no, fallback)
  const prevData = React.useMemo(() => {
    const n = categories.length;
    const firstKey = categories[0];
    const pos = ref.categories.indexOf(firstKey ?? "");
    if (pos > 0) {
      const from = Math.max(0, pos - n);
      if (pos - from === n) {
        const totalsAll = ref.series.reduce<number[]>(
          (acc, s) => acc.map((v, i) => v + (s.data[i] ?? 0)),
          new Array(ref.categories.length).fill(0)
        );
        return totalsAll.slice(from, pos);
      }
    }
    return buildPrevWindowFallback(visibleTags, categories, gran);
  }, [ref, visibleTags, categories, gran]);

  // 3) KPIs
  const lastVal = currentData.at(-1) ?? 0;
  const lastPrev = prevData.at(-1) ?? 0;
  const deltaPct =
    lastPrev === 0 ? (lastVal > 0 ? 100 : 0) : ((lastVal - lastPrev) / lastPrev) * 100;

  // Estilos / labels extremos
  const colorsByName = React.useMemo(
    () => ({ Total: "#3B82F6", Anterior: "#CBD5E1" }),
    []
  );
  const startLabel = categories[0] ? fmtDateLabel(categories[0]) : "";
  const endLabel = categories.at(-1) ? fmtDateLabel(categories.at(-1)!) : "";

  return (
    <div className="h-full flex flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#14181e]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <SectionTitle title={title} subtitle={subtitle} />
        <div className="text-right">
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            {Intl.NumberFormat().format(lastVal)}
          </div>
          <div
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              deltaPct >= 0
                ? "bg-amber-100 text-amber-700 dark:bg-white/10 dark:text-amber-300"
                : "bg-red-100 text-red-700 dark:bg-white/10 dark:text-red-300"
            }`}
            title="Variación vs. periodo anterior"
          >
            {deltaPct >= 0 ? "+" : ""}
            {deltaPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1">
        <LineChart
          type="line"
          smooth
          categories={categories}
          series={[
            { name: "Total", data: currentData },
            { name: "Anterior", data: prevData },
          ]}
          showLegend={false}
          height={height}
          colorsByName={colorsByName}
          optionsExtra={{
            // quitar padding que agrega espacio en blanco inferior
            grid: { show: false, padding: { top: 0, right: 8, bottom: 0, left: 8 } },
            chart: {
              // evita offsets extra de Apex
              parentHeightOffset: 0,
              toolbar: { show: false },
            },
            stroke: { width: [2, 2], dashArray: [0, 6], curve: "smooth" },
            markers: { size: 0, hover: { sizeOffset: 2 } },
            xaxis: {
              // sólo extremos; subimos las etiquetas para que no "empujen" el área
              labels: {
                rotate: 0,
                trim: true,
                offsetY: -10,
                formatter: (_val: string, idx?: number, opts?: { w?: { config?: { labels?: string[] } } }) => {
                  const i = idx ?? 0;
                  const len = opts?.w?.config?.labels?.length ?? categories.length;
                  if (i === 0) return startLabel;
                  if (i === len - 1) return endLabel;
                  return "·";
                },
                style: { fontSize: "12px" },
              },
              axisBorder: { show: false },
              axisTicks: { show: false },
              tickAmount: categories.length,
              tooltip: { enabled: false },
            },
            yaxis: { labels: { show: false } },
            legend: { show: false },
          }}
        />
      </div>
    </div>
  );
}
