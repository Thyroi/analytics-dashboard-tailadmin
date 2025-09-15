"use client";

import type { Granularity } from "@/lib/chatbot/tags";
import {
  SERIES,
  TAG_META,
  PUEBLOS,
  PUEBLO_META,
  VISIBLE_TAG_SPECS,
} from "@/lib/mockData";
import { useCallback, useMemo, useState } from "react";
import SectorExpandedCardDrilldown from "./SectorExpandedCardDrilldown";
import SectorDeltaCard from "./SectorDeltaCard";
import { TAG_IMAGE_BY_ID } from "./tag-assets";

export type SeriesPoint = { label: string; value: number };

/* ==== helpers fechas/series ==== */
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
    case "d": startTime = addDaysISO(endTime, -29); break;
    case "w": startTime = addDaysISO(endTime, -27); break;
    case "m":
    case "y":
    default:  startTime = addDaysISO(endTime, -364); break;
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
  return dateRangeDays(start, end).map((d) => ({ label: d, value: (byDate[d] as number) || 0 }));
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

/* ==== helpers UI ==== */
type StaticImageImport = { src: string };
function isStaticImageImport(value: unknown): value is StaticImageImport {
  return typeof value === "object" && value !== null && "src" in value;
}
function getTagLabel(tagId: string) {
  return TAG_META[tagId as keyof typeof TAG_META]?.label ?? humanize(tagId);
}
function getPuebloLabel(pId: string) {
  return PUEBLO_META[pId]?.label ?? humanize(pId);
}
function humanize(s: string) {
  return s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}

/* ==== subtags por tag ==== */
const SUBTAGS_BY_TAG: Record<string, string[]> = Object.fromEntries(
  VISIBLE_TAG_SPECS.map(({ id, subtags }) => [id, subtags])
);

/* ==== breadcrumb ==== */
type CrumbType = "tag" | "pueblo" | "subtag";
type BreadcrumbNode = { id: string; label: string; type?: CrumbType };

const ROW_H = 260;

export default function SectorsByTagSectionDetailed() {
  const [granularity, setGranularity] = useState<Granularity>("m");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [secondaryTownId, setSecondaryTownId] = useState<string | null>(null);
  const [selectedSubtagId, setSelectedSubtagId] = useState<string | null>(null);

  const range = useMemo(() => deriveRangeFromGranularity(granularity, SERIES), [granularity]);
  const prevRange = useMemo(() => previousComparable(range), [range]);

  const tagIds = useMemo(() => Object.keys(TAG_META) as Array<keyof typeof TAG_META>, []);

  // Serie línea superior (tag agregado)
  const seriesForTop = useCallback((tagId: string) => {
    const key = tagId;
    const dCurr = buildDailyPointsForKey(key, range.startTime, range.endTime);
    const dPrev = buildDailyPointsForKey(key, prevRange.startTime, prevRange.endTime);
    if (granularity === "d") return { current: dCurr, previous: dPrev };
    if (granularity === "w") return { current: aggregateWeekly(dCurr), previous: aggregateWeekly(dPrev) };
    return { current: aggregateMonthly(dCurr), previous: aggregateMonthly(dPrev) };
  }, [granularity, prevRange.endTime, prevRange.startTime, range.endTime, range.startTime]);

  // Donut superior: pueblos que aportan al tag
  const donutForTop = useCallback((tagId: string) => {
    const rows = PUEBLOS.map((p) => ({
      puebloId: p,
      label: getPuebloLabel(p),
      value: sumKeyInRange(`${p}.${tagId}`, range.startTime, range.endTime),
    }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      data: rows.map(({ label, value }) => ({ label, value })),
      ids: rows.map(({ puebloId }) => puebloId),
    };
  }, [range.endTime, range.startTime]);

  // Serie línea detalle (pueblo.tag)
  const seriesForDetail = useCallback((tagId: string, puebloId: string) => {
    const key = `${puebloId}.${tagId}`;
    const dCurr = buildDailyPointsForKey(key, range.startTime, range.endTime);
    const dPrev = buildDailyPointsForKey(key, prevRange.startTime, prevRange.endTime);
    if (granularity === "d") return { current: dCurr, previous: dPrev };
    if (granularity === "w") return { current: aggregateWeekly(dCurr), previous: aggregateWeekly(dPrev) };
    return { current: aggregateMonthly(dCurr), previous: aggregateMonthly(dPrev) };
  }, [granularity, prevRange.endTime, prevRange.startTime, range.endTime, range.startTime]);

  // Donut detalle: subtags dentro de pueblo.tag
  const donutForDetail = useCallback((tagId: string, puebloId: string) => {
    const subtags = SUBTAGS_BY_TAG[tagId] ?? [];
    const rows = subtags
      .map((s) => ({
        subtagId: s,
        label: humanize(s),
        value: sumKeyInRange(`${puebloId}.${tagId}.${s}`, range.startTime, range.endTime),
      }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      data: rows.map(({ label, value }) => ({ label, value })),
      ids: rows.map(({ subtagId }) => subtagId),
    };
  }, [range.endTime, range.startTime]);

  // Serie subdetalle (pueblo.tag.subtag)
  const seriesForSubDetail = useCallback((tagId: string, puebloId: string, subtagId: string) => {
    const key = `${puebloId}.${tagId}.${subtagId}`;
    const dCurr = buildDailyPointsForKey(key, range.startTime, range.endTime);
    const dPrev = buildDailyPointsForKey(key, prevRange.startTime, prevRange.endTime);
    if (granularity === "d") return { current: dCurr, previous: dPrev };
    if (granularity === "w") return { current: aggregateWeekly(dCurr), previous: aggregateWeekly(dPrev) };
    return { current: aggregateMonthly(dCurr), previous: aggregateMonthly(dPrev) };
  }, [granularity, prevRange.endTime, prevRange.startTime, range.endTime, range.startTime]);

  return (
    <section className="max-w-[1560px]">
      {/* Header */}
      <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
        <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-rose-100 text-rose-700 ring-1 ring-black/5">
          <span className="text-sm">🔎</span>
        </span>
        Interacciones por sectores (drill)
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
              {g === "d" ? "Día" : g === "w" ? "Semana" : g === "m" ? "Mes" : "Año"}
            </button>
          ))}
        </span>
      </h3>

      {/* Grid */}
      <div
        className="
          grid grid-flow-dense
          grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
          gap-4
        "
        style={{ gridAutoRows: `minmax(${ROW_H}px, auto)` }}
      >
        {(Object.keys(TAG_META) as Array<keyof typeof TAG_META>).map((tagId) => {
          const currTop = sumKeyInRange(tagId, range.startTime, range.endTime);
          const prevTop = sumKeyInRange(tagId, prevRange.startTime, prevRange.endTime);
          const deltaTop = Math.round(pctChange(currTop, prevTop));

          const Title = getTagLabel(tagId);
          const IconSvg = TAG_META[tagId].icon;

          const rawImg = TAG_IMAGE_BY_ID[tagId];
          const imgSrc =
            typeof rawImg === "string"
              ? rawImg
              : isStaticImageImport(rawImg)
              ? (rawImg as StaticImageImport).src
              : undefined;

          if (expandedId === tagId) {
            // Par superior (NO reactivo)
            const sTop = seriesForTop(tagId);
            const donutTopPack = donutForTop(tagId);
            const donutTopData = donutTopPack.data;
            const topIdsMap = donutTopPack.ids;

            // Breadcrumb
            const breadcrumb: BreadcrumbNode[] = [
              { id: tagId as string, label: getTagLabel(tagId), type: "tag" },
              ...(secondaryTownId ? [{ id: secondaryTownId, label: getPuebloLabel(secondaryTownId), type: "pueblo" as const }] : []),
              ...(secondaryTownId && selectedSubtagId
                ? [{ id: selectedSubtagId, label: humanize(selectedSubtagId), type: "subtag" as const }]
                : []),
            ];

            const onCrumbClick = (_node: BreadcrumbNode, index: number): void => {
              if (index === 0) {
                setSecondaryTownId(null);
                setSelectedSubtagId(null);
              } else if (index === 1) {
                setSelectedSubtagId(null);
              }
            };

            const onTopSliceClick = (_d: { label: string; value: number }, meta?: { index: number }): void => {
              if (!meta) return;
              const puebloId = topIdsMap[meta.index];
              if (puebloId) {
                setSecondaryTownId(puebloId);
                setSelectedSubtagId(null);
              }
            };

            // Detalle (2º nivel)
            let detailCurrent: SeriesPoint[] | undefined;
            let detailPrevious: SeriesPoint[] | undefined;
            let detailDonutData: { label: string; value: number }[] | undefined;
            let detailDeltaPct: number | undefined;
            let detailIdsMap: string[] = [];

            if (secondaryTownId) {
              const sDetail = seriesForDetail(tagId, secondaryTownId);
              detailCurrent = sDetail.current;
              detailPrevious = sDetail.previous;

              const currDetailSum = sumKeyInRange(`${secondaryTownId}.${tagId}`, range.startTime, range.endTime);
              const prevDetailSum = sumKeyInRange(`${secondaryTownId}.${tagId}`, prevRange.startTime, prevRange.endTime);
              detailDeltaPct = Math.round(pctChange(currDetailSum, prevDetailSum));

              const donutDetailPack = donutForDetail(tagId, secondaryTownId);
              detailDonutData = donutDetailPack.data;
              detailIdsMap = donutDetailPack.ids;
            }

            const onDetailSliceClick = (_d: { label: string; value: number }, meta?: { index: number }): void => {
              if (!meta || !secondaryTownId) return;
              const subtagId = detailIdsMap[meta.index];
              if (subtagId) setSelectedSubtagId(subtagId);
            };

            // Subdetalle (3º nivel)
            let subDetailCurrent: SeriesPoint[] | undefined;
            let subDetailPrevious: SeriesPoint[] | undefined;
            let subDetailDeltaPct: number | undefined;

            if (secondaryTownId && selectedSubtagId) {
              const sSub = seriesForSubDetail(tagId, secondaryTownId, selectedSubtagId);
              subDetailCurrent = sSub.current;
              subDetailPrevious = sSub.previous;

              const currSub = sumKeyInRange(
                `${secondaryTownId}.${tagId}.${selectedSubtagId}`,
                range.startTime,
                range.endTime
              );
              const prevSub = sumKeyInRange(
                `${secondaryTownId}.${tagId}.${selectedSubtagId}`,
                prevRange.startTime,
                prevRange.endTime
              );
              subDetailDeltaPct = Math.round(pctChange(currSub, prevSub));

              // ========= DEBUG: LOG DE LA LEAF =========
              const leafKey = `${secondaryTownId}.${tagId}.${selectedSubtagId}`;
              const leafDebug = {
                leafKey,
                ids: {
                  tagId: tagId as string,
                  puebloId: secondaryTownId,
                  subtagId: selectedSubtagId,
                },
                labels: {
                  tag: getTagLabel(tagId),
                  pueblo: getPuebloLabel(secondaryTownId),
                  subtag: humanize(selectedSubtagId),
                },
                range: { ...range },
                prevRange: { ...prevRange },
                totals: {
                  current: currSub,
                  previous: prevSub,
                },
                series: {
                  currentDaily: buildDailyPointsForKey(leafKey, range.startTime, range.endTime),
                  previousDaily: buildDailyPointsForKey(leafKey, prevRange.startTime, prevRange.endTime),
                },
              };
              // eslint-disable-next-line no-console
              console.log("[DRILL][LEAF]", leafDebug);
            }

            const commonProps = {
              title: Title,
              deltaPct: deltaTop,
              mode: "granularity" as const,
              granularity,
              onGranularityChange: setGranularity,
              startDate: new Date(range.startTime),
              endDate: new Date(range.endTime),
              onRangeChange: () => {},
              onClearRange: () => {},
              current: sTop.current,            // NO reactivo
              previous: sTop.previous,          // NO reactivo
              donutData: donutTopData,          // NO reactivo
              onClose: () => {
                setExpandedId(null);
                setSecondaryTownId(null);
                setSelectedSubtagId(null);
              },
            };

            return (
              <div
                key={`expanded-${tagId}`}
                className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 row-span-2"
              >
                {imgSrc ? (
                  <SectorExpandedCardDrilldown
                    {...commonProps}
                    imgSrc={imgSrc}
                    donutTitle="Pueblos"
                    donutMaxSlices={999}             // sin "Otros" en el superior
                    onDonutSliceClick={onTopSliceClick}
                    breadcrumb={breadcrumb}
                    onBreadcrumbClick={onCrumbClick}
                    // Detalle (2º nivel)
                    detailCurrent={detailCurrent}
                    detailPrevious={detailPrevious}
                    detailDonutData={detailDonutData}
                    detailDeltaPct={detailDeltaPct}
                    detailDonutTitle="Subcategorías"
                    detailDonutMaxSlices={8}
                    onDetailDonutSliceClick={onDetailSliceClick}
                    // Subdetalle (3º nivel)
                    subDetailCurrent={subDetailCurrent}
                    subDetailPrevious={subDetailPrevious}
                    subDetailDeltaPct={subDetailDeltaPct}
                  />
                ) : (
                  <SectorExpandedCardDrilldown
                    {...commonProps}
                    Icon={IconSvg}
                    donutTitle="Pueblos"
                    donutMaxSlices={999}
                    onDonutSliceClick={onTopSliceClick}
                    breadcrumb={breadcrumb}
                    onBreadcrumbClick={onCrumbClick}
                    detailCurrent={detailCurrent}
                    detailPrevious={detailPrevious}
                    detailDonutData={detailDonutData}
                    detailDeltaPct={detailDeltaPct}
                    detailDonutTitle="Subcategorías"
                    detailDonutMaxSlices={8}
                    onDetailDonutSliceClick={onDetailSliceClick}
                    subDetailCurrent={subDetailCurrent}
                    subDetailPrevious={subDetailPrevious}
                    subDetailDeltaPct={subDetailDeltaPct}
                  />
                )}
              </div>
            );
          }

          return (
            <div key={tagId} className="row-span-1">
              {imgSrc ? (
                <SectorDeltaCard
                  title={Title}
                  deltaPct={deltaTop}
                  imgSrc={imgSrc}
                  height={ROW_H}
                  ringSize={96}
                  ringThickness={8}
                  expanded={false}
                  onClick={() => {
                    setExpandedId(tagId as string);
                    setSecondaryTownId(null);
                    setSelectedSubtagId(null);
                  }}
                  className="h-full"
                />
              ) : (
                <SectorDeltaCard
                  title={Title}
                  deltaPct={deltaTop}
                  Icon={IconSvg}
                  height={ROW_H}
                  ringSize={96}
                  ringThickness={8}
                  expanded={false}
                  onClick={() => {
                    setExpandedId(tagId as string);
                    setSecondaryTownId(null);
                    setSelectedSubtagId(null);
                  }}
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
