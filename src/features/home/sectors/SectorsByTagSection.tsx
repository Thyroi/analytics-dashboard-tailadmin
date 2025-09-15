"use client";

import type { Granularity } from "@/lib/chatbot/tags";
import { SERIES, TAG_META } from "@/lib/mockData";
import { useCallback, useMemo, useState } from "react";
import SectorDeltaCard from "./SectorDeltaCard";
import SectorExpandedCard from "./SectorExpandedCard";
import { TAG_IMAGE_BY_ID } from "./tag-assets";

export type SeriesPoint = { label: string; value: number };

// ===== helpers fechas/series =====
function addDaysISO(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
function dateRangeDays(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const d0 = new Date(startISO + "T00:00:00Z");
  const d1 = new Date(endISO + "T00:00:00Z");
  for (let d = new Date(d0); d <= d1; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
function pctChange(curr: number, prev: number): number {
  if (!isFinite(prev) || prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}
function deriveRangeFromGranularity(g: Granularity, series: typeof SERIES) {
  let last = "";
  for (const byDate of Object.values(series)) {
    for (const d of Object.keys(byDate)) if (d > last) last = d;
  }
  const endTime = last;
  let startTime = endTime;
  switch (g) {
    case "d":
      startTime = addDaysISO(endTime, -29);
      break;
    case "w":
      startTime = addDaysISO(endTime, -27);
      break;
    case "m":
    case "y":
    default:
      startTime = addDaysISO(endTime, -364);
      break;
  }
  return { startTime, endTime };
}
function previousComparable(range: { startTime: string; endTime: string }) {
  const days = dateRangeDays(range.startTime, range.endTime).length;
  const prevEnd = addDaysISO(range.startTime, -1);
  const prevStart = addDaysISO(prevEnd, -(days - 1));
  return { startTime: prevStart, endTime: prevEnd };
}
function sumKeyInRange(key: string, start: string, end: string): number {
  const byDate = SERIES[key];
  if (!byDate) return 0;
  let acc = 0;
  for (const d of dateRangeDays(start, end)) acc += (byDate[d] as number) || 0;
  return acc;
}
function buildDailyPointsForKey(
  key: string,
  start: string,
  end: string
): SeriesPoint[] {
  const byDate = SERIES[key] ?? {};
  return dateRangeDays(start, end).map((d) => ({
    label: d,
    value: (byDate[d] as number) || 0,
  }));
}
function aggregateWeekly(daily: SeriesPoint[]): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, Math.min(i + 7, daily.length));
    const sum = chunk.reduce((a, p) => a + p.value, 0);
    const label = `${chunk[0].label} → ${chunk[chunk.length - 1].label}`;
    out.push({ label, value: sum });
  }
  return out;
}
function aggregateMonthly(daily: SeriesPoint[]): SeriesPoint[] {
  const map = new Map<string, number>();
  daily.forEach((p) => {
    const k = p.label.slice(0, 7);
    map.set(k, (map.get(k) || 0) + p.value);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([label, value]) => ({ label, value }));
}
function getSubtags(tag: string): string[] {
  const set = new Set<string>();
  for (const key of Object.keys(SERIES)) {
    if (key.startsWith(tag + ".")) {
      const parts = key.split(".");
      if (parts.length === 2) set.add(parts[1]);
    }
  }
  return [...set];
}
function prettyLabel(s: string): string {
  return s
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

// ===== type guard para StaticImport =====
type StaticImageImport = { src: string };
function isStaticImageImport(value: unknown): value is StaticImageImport {
  return typeof value === "object" && value !== null && "src" in value;
}

// ===== componente =====
const ROW_H = 260;

export default function SectorsByTagSection() {
  const [granularity, setGranularity] = useState<Granularity>("m");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const range = useMemo(
    () => deriveRangeFromGranularity(granularity, SERIES),
    [granularity]
  );
  const prevRange = useMemo(() => previousComparable(range), [range]);

  const ids = useMemo(
    () => Object.keys(TAG_META) as Array<keyof typeof TAG_META>,
    []
  );

  const seriesFor = useCallback(
    (id: string) => {
      const dCurr = buildDailyPointsForKey(id, range.startTime, range.endTime);
      const dPrev = buildDailyPointsForKey(
        id,
        prevRange.startTime,
        prevRange.endTime
      );
      if (granularity === "d") return { current: dCurr, previous: dPrev };
      if (granularity === "w")
        return {
          current: aggregateWeekly(dCurr),
          previous: aggregateWeekly(dPrev),
        };
      return {
        current: aggregateMonthly(dCurr),
        previous: aggregateMonthly(dPrev),
      };
    },
    [
      granularity,
      prevRange.endTime,
      prevRange.startTime,
      range.endTime,
      range.startTime,
    ]
  );

  const donutFor = useCallback(
    (id: string) =>
      getSubtags(id)
        .map((s) => ({
          label: prettyLabel(s),
          value: sumKeyInRange(`${id}.${s}`, range.startTime, range.endTime),
        }))
        .filter((r) => r.value > 0),
    [range.endTime, range.startTime]
  );

  console.log("render SectorsByTagSection:", TAG_META);

  return (
    <section className="max-w-[1560px]">
      <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
        <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-rose-100 text-rose-700 ring-1 ring-black/5">
          <span className="text-sm">🔎</span>
        </span>
        Interacciones por sectores
        <span className="ml-auto inline-flex gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1116] p-1">
          {(["d", "w", "m", "y"] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                granularity === g
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {g === "d"
                ? "Día"
                : g === "w"
                ? "Semana"
                : g === "m"
                ? "Mes"
                : "Año"}
            </button>
          ))}
        </span>
      </h3>

      <div
        className="
          grid grid-flow-dense
          grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
          gap-4
        "
        // ✅ filas con altura mínima de ROW_H pero que pueden crecer según el contenido
        style={{ gridAutoRows: `minmax(${ROW_H}px, auto)` }}
      >
        {ids.map((id) => {
          const curr = sumKeyInRange(id, range.startTime, range.endTime);
          const prev = sumKeyInRange(
            id,
            prevRange.startTime,
            prevRange.endTime
          );
          const deltaPct = Math.round(pctChange(curr, prev));
          const Title = TAG_META[id].label;
          const IconSvg = TAG_META[id].icon;

          const rawImg = TAG_IMAGE_BY_ID[id];
          const imgSrc =
            typeof rawImg === "string"
              ? rawImg
              : isStaticImageImport(rawImg)
              ? (rawImg as StaticImageImport).src
              : undefined;

          if (expandedId === id) {
            const s = seriesFor(id);
            const donutData = donutFor(id);

            return (
              <div
                key={`expanded-${id}`}
                className="
                  col-span-1 sm:col-span-2
                  lg:col-span-3 xl:col-span-4
                  row-span-2
                "
              >
                {imgSrc ? (
                  <SectorExpandedCard
                    title={Title}
                    imgSrc={imgSrc}
                    deltaPct={deltaPct}
                    mode="granularity"
                    granularity={granularity}
                    onGranularityChange={setGranularity}
                    startDate={new Date(range.startTime)}
                    endDate={new Date(range.endTime)}
                    onRangeChange={() => {}}
                    onClearRange={() => {}}
                    current={s.current}
                    previous={s.previous}
                    donutData={donutData}
                    onClose={() => setExpandedId(null)}
                  />
                ) : (
                  <SectorExpandedCard
                    title={Title}
                    Icon={IconSvg}
                    deltaPct={deltaPct}
                    mode="granularity"
                    granularity={granularity}
                    onGranularityChange={setGranularity}
                    startDate={new Date(range.startTime)}
                    endDate={new Date(range.endTime)}
                    onRangeChange={() => {}}
                    onClearRange={() => {}}
                    current={s.current}
                    previous={s.previous}
                    donutData={donutData}
                    onClose={() => setExpandedId(null)}
                  />
                )}
              </div>
            );
          }

          return (
            <div key={id} className="row-span-1">
              {imgSrc ? (
                <SectorDeltaCard
                  title={Title}
                  deltaPct={deltaPct}
                  imgSrc={imgSrc}
                  height={ROW_H}
                  ringSize={96}
                  ringThickness={8}
                  expanded={false}
                  onClick={() => setExpandedId(id)}
                  className="h-full"
                />
              ) : (
                <SectorDeltaCard
                  title={Title}
                  deltaPct={deltaPct}
                  Icon={IconSvg}
                  height={ROW_H}
                  ringSize={96}
                  ringThickness={8}
                  expanded={false}
                  onClick={() => setExpandedId(id)}
                  className="h-full"
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
