"use client";

import {
  childrenPattern,
  makeBody,
  postAuditTags,
  searchTokenPattern,
} from "@/features/chatbot/services/mindsAic";
import type { AuditTagsResponse } from "@/features/chatbot/types/tags";
import {
  SERIES,
  getLastDate,
  TAG_META,
  TAG_COLOR_HEX_BY_TAG,
} from "@/lib/mockData";
import type { TagMeta } from "@/lib/mockData";
import { useEffect, useMemo, useState } from "react";
import type { Granularity } from "@/lib/chatbot/tags";

/* ===================== Tipos base ===================== */
export type QueryBase = {
  granularity: Granularity; // "d" | "w" | "m" | "y"
  startTime?: string;
  endTime?: string;
};

type MinimalNode = { key?: string; path?: string; label?: string } & Record<
  string,
  unknown
>;
type RespBase = { nodes?: MinimalNode[]; total?: number } & Record<
  string,
  unknown
>;

export type ColoredNode = MinimalNode & { chipClass: string; chipHex: string };
export type ColoredAuditTagsResponse = Omit<RespBase, "nodes"> & {
  nodes: ColoredNode[];
};

type UseAuditState = {
  data: ColoredAuditTagsResponse | null;
  error: unknown;
  loading: boolean;
};

/* ===================== Colores chips ===================== */
const ROOT_TEXT_CLASS_BY_ID: Record<string, string> = {
  circuitoMonteblanco: "text-indigo-600",
  donana: "text-emerald-600",
  espaciosMuseisticos: "text-sky-600",
  fiestasTradiciones: "text-fuchsia-600",
  laRabida: "text-rose-600",
  lugaresColombinos: "text-teal-600",
  naturaleza: "text-orange-600",
  patrimonio: "text-violet-600",
  playa: "text-blue-600",
  rutasCulturales: "text-amber-600",
  rutasSenderismo: "text-lime-600",
  sabor: "text-pink-600",
};
const TAILWIND_TO_HEX: Record<string, string> = {
  "text-blue-600": "#2563EB",
  "text-emerald-600": "#059669",
  "text-amber-600": "#D97706",
  "text-rose-600": "#E11D48",
  "text-slate-700": "#334155",
  "text-fuchsia-600": "#C026D3",
  "text-orange-600": "#EA580C",
  "text-teal-600": "#0D9488",
  "text-violet-600": "#7C3AED",
  "text-indigo-600": "#4F46E5",
  "text-sky-600": "#0284C7",
  "text-lime-600": "#65A30D",
  "text-pink-600": "#DB2777",
};

function normalizePrefix(prefix?: string | null): string {
  if (!prefix || !prefix.trim()) return "root";
  const t = prefix.trim().replace(/\.+$/g, "").replace(/\.{2,}/g, ".");
  return t || "root";
}
function rootFromPath(path?: string): string {
  if (!path) return "";
  const i = path.indexOf(".");
  return i === -1 ? path : path.slice(0, i);
}
function colorForRoot(root: string) {
  const cls = ROOT_TEXT_CLASS_BY_ID[root] ?? "text-slate-700";
  const hex = TAILWIND_TO_HEX[cls] ?? TAILWIND_TO_HEX["text-slate-700"];
  return { cls, hex };
}
function decorate(res: RespBase | null): ColoredAuditTagsResponse | null {
  if (!res) return null;
  const nodes = (res.nodes ?? []).map<ColoredNode>((n) => {
    const r = colorForRoot(rootFromPath(n.path));
    return { ...n, chipClass: r.cls, chipHex: r.hex };
  });
  const { nodes: _omit, ...rest } = res;
  return { ...rest, nodes };
}

/* ===================== API mindsAic ===================== */
function useAuditTags(pattern: string | null, opts: QueryBase): UseAuditState {
  const [state, setState] = useState<UseAuditState>({
    data: null,
    error: null,
    loading: false,
  });
  const bodyArgs = useMemo(
    () => [opts.granularity, opts.startTime, opts.endTime] as const,
    [opts.granularity, opts.startTime, opts.endTime]
  );

  useEffect(() => {
    if (!pattern) return;
    const controller = new AbortController();
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const body = makeBody(pattern, bodyArgs[0], bodyArgs[1], bodyArgs[2]);
        const raw: AuditTagsResponse = await postAuditTags(body, {
          signal: controller.signal,
        });
        setState({
          data: decorate(raw as RespBase),
          error: null,
          loading: false,
        });
      } catch (e: unknown) {
        if ((e as { name?: string })?.name === "AbortError") return;
        setState({ data: null, error: e, loading: false });
      }
    })();
    return () => controller.abort();
  }, [pattern, bodyArgs]);

  return state;
}

export function useChildrenOf(
  prefix: string | null | undefined,
  opts: QueryBase
) {
  const norm = useMemo(() => normalizePrefix(prefix), [prefix]);
  const pattern = useMemo(() => childrenPattern(norm), [norm]);
  return useAuditTags(pattern, opts);
}

export function useChildrenOfMany(
  prefixes: Array<string | null | undefined>,
  opts: QueryBase
) {
  const norms = useMemo(
    () => prefixes.map((p) => normalizePrefix(p)),
    [prefixes]
  );
  const [state, setState] = useState<UseAuditState>({
    data: null,
    error: null,
    loading: false,
  });

  useEffect(() => {
    if (!norms.length) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    const controller = new AbortController();
    (async () => {
      setState({ data: null, error: null, loading: true });
      try {
        const bodies = norms.map((n) =>
          makeBody(
            childrenPattern(n),
            opts.granularity,
            opts.startTime,
            opts.endTime
          )
        );
        const results = await Promise.all(
          bodies.map(
            (b) =>
              postAuditTags(b, {
                signal: controller.signal,
              }) as Promise<AuditTagsResponse>
          )
        );
        const decorated = results
          .map((r) => decorate(r as RespBase))
          .filter(Boolean) as ColoredAuditTagsResponse[];
        const nodesMap = new Map<string, ColoredNode>();
        let total = 0;
        for (const r of decorated) {
          total += typeof r.total === "number" ? r.total : 0;
          for (const n of r.nodes) {
            const id = n.key ?? n.path ?? "";
            if (!id) continue;
            if (!nodesMap.has(id)) nodesMap.set(id, n);
          }
        }
        setState({
          data: { nodes: Array.from(nodesMap.values()), total },
          error: null,
          loading: false,
        });
      } catch (e: unknown) {
        if ((e as { name?: string })?.name === "AbortError") return;
        setState({ data: null, error: e, loading: false });
      }
    })();
    return () => controller.abort();
  }, [norms, opts.granularity, opts.startTime, opts.endTime]);

  return state;
}

export function useSearchByToken(token: string | null, opts: QueryBase) {
  const safe = useMemo(
    () => (token && token.trim().length ? token.trim() : null),
    [token]
  );
  const pattern = useMemo(
    () => (safe ? searchTokenPattern(safe) : null),
    [safe]
  );
  return useAuditTags(pattern, opts);
}

export function useRootTags(opts: QueryBase) {
  return useChildrenOf("root", opts);
}

/* ===================== Utils fechas/series locales ===================== */
export type TotalsRange = { startTime?: string; endTime?: string };
export type Totals = { interactions: number; visits: number };

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
function isInRange(date: string, start?: string, end?: string) {
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}
function depthOfKey(k: string): number {
  return k.split(".").length;
}
function isTownLeafKey(k: string): boolean {
  return depthOfKey(k) === 3; // pueblo.tag.subtag
}
function isGlobalLeafKey(k: string): boolean {
  return depthOfKey(k) === 2; // tag.subtag
}
function getLeafKeys(): string[] {
  const keys = Object.keys(SERIES);
  const townLeaf = keys.filter(isTownLeafKey);
  return townLeaf.length ? townLeaf : keys.filter(isGlobalLeafKey);
}
function sumKeyOverRange(key: string, start?: string, end?: string): number {
  const s = SERIES[key];
  if (!s) return 0;
  let acc = 0;
  for (const [date, value] of Object.entries(s)) {
    if (isInRange(date, start, end)) acc += (value as number) ?? 0;
  }
  return acc;
}
export function calcTotalsFromSeries(range?: TotalsRange): Totals {
  const start = range?.startTime;
  const end = range?.endTime;
  const keys = getLeafKeys();
  const interactions = keys.reduce(
    (acc, k) => acc + sumKeyOverRange(k, start, end),
    0
  );
  const visits = Math.round(interactions * 2.1);
  return { interactions, visits };
}

/* ===================== Derivar rango según granularidad ===================== */
function deriveRangeFromGranularity(g: Granularity): TotalsRange {
  const end = getLastDate(SERIES);
  switch (g) {
    case "d": {
      const start = addDaysISO(end, -29); // últimos 30 días
      return { startTime: start, endTime: end };
    }
    case "w": {
      const start = addDaysISO(end, -27); // 4 semanas (28 días)
      return { startTime: start, endTime: end };
    }
    case "y":
    case "m": {
      // ~12 meses (365 días) para mensual/anual
      const start = addDaysISO(end, -364);
      return { startTime: start, endTime: end };
    }
    default:
      return {};
  }
}

/* ===================== Series agregadas p/ gráficas ===================== */
export type SeriesPoint = { label: string; value: number };
export type KPIBucket = "day" | "week" | "month" | "daily";
export type KPISeries = {
  bucket: KPIBucket;
  current: SeriesPoint[];
  previous: SeriesPoint[];
};

function buildDailyTotalsSeries(start: string, end: string): SeriesPoint[] {
  const dates = dateRangeDays(start, end);
  const keys = getLeafKeys();
  return dates.map((d) => {
    let sum = 0;
    for (const k of keys) {
      const v = (SERIES[k] && SERIES[k][d]) || 0;
      sum += (v as number) || 0;
    }
    return { label: d, value: sum };
  });
}

function chunkFromEnd<T>(arr: T[], size: number): T[][] {
  // Agrupa en bloques contiguos de `size` empezando desde el inicio
  const out: T[][] = [];
  for (let start = 0; start < arr.length; start += size) {
    out.push(arr.slice(start, Math.min(start + size, arr.length)));
  }
  return out;
}

function aggregateWeekly(daily: SeriesPoint[]): SeriesPoint[] {
  const weeks = chunkFromEnd(daily, 7);
  return weeks.map((w) => {
    const sum = w.reduce((a, p) => a + p.value, 0);
    const label = `${w[0].label} → ${w[w.length - 1].label}`;
    return { label, value: sum };
  });
}

function aggregateMonthly(daily: SeriesPoint[]): SeriesPoint[] {
  const map = new Map<string, number>();
  for (const p of daily) {
    const key = p.label.slice(0, 7); // YYYY-MM
    map.set(key, (map.get(key) ?? 0) + p.value);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([label, value]) => ({ label, value }));
}

/* ===================== Comparables (periodo anterior) ===================== */
function comparablePreviousRange(range: TotalsRange): TotalsRange {
  if (!range.startTime || !range.endTime) return {};
  const lenDays = dateRangeDays(range.startTime, range.endTime).length; // inclusivo
  const prevEnd = addDaysISO(range.startTime, -1);
  const prevStart = addDaysISO(prevEnd, -(lenDays - 1));
  return { startTime: prevStart, endTime: prevEnd };
}

function pctChange(curr: number, prev: number): number {
  if (!isFinite(prev) || prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

/* ===================== Hooks de totales existentes ===================== */
export function useTotals(
  range?: TotalsRange,
  granularity?: Granularity
): Totals {
  const effectiveRange = useMemo<TotalsRange>(() => {
    if (!range?.startTime && !range?.endTime && granularity) {
      return deriveRangeFromGranularity(granularity);
    }
    return range ?? {};
  }, [range?.startTime, range?.endTime, granularity]);

  return useMemo(
    () => calcTotalsFromSeries(effectiveRange),
    [effectiveRange.startTime, effectiveRange.endTime]
  );
}

/* ===================== Pueblos (se mantienen) ===================== */
export const PUEBLOS = [
  "almonte",
  "bollullos",
  "bonares",
  "chucena",
  "crucesMayoBonares",
  "escacena",
  "hinojos",
  "laPalmaDelCondado",
  "lucenaDelPuerto",
  "manzanilla",
  "niebla",
  "palos",
  "paternaDelCampo",
  "puertasMurallaNiebla",
  "rocianaDelCondado",
  "sinCategoria",
  "villalba",
  "villarrasa",
] as const;

export type PuebloId = (typeof PUEBLOS)[number];

export type TownTotals = {
  town: PuebloId;
  interactions: number;
  visits: number;
};

function isKeyOfTown(key: string, town: PuebloId): boolean {
  return key.startsWith(`${town}.`);
}

function sumTownOverRange(
  town: PuebloId,
  start?: string,
  end?: string
): number {
  let acc = 0;
  for (const key of Object.keys(SERIES)) {
    if (!isKeyOfTown(key, town)) continue;
    const byDate = SERIES[key];
    for (const [date, value] of Object.entries(byDate)) {
      if (!isInRange(date, start, end)) continue;
      acc += (value as number) ?? 0;
    }
  }
  return acc;
}

export function calcTownTotalsFromSeries(
  range?: TotalsRange,
  granularity?: Granularity
): TownTotals[] {
  const start = range?.startTime;
  const end = range?.endTime;
  void granularity;

  const rows: TownTotals[] = PUEBLOS.map((town) => {
    const interactions = sumTownOverRange(town, start, end);
    const visits = Math.round(interactions * 2.1);
    return { town, interactions, visits };
  });

  rows.sort((a, b) => b.interactions - a.interactions);
  return rows;
}

export function useTownTotals(
  granularity: Granularity,
  range?: TotalsRange
): TownTotals[] {
  const effectiveRange = useMemo<TotalsRange>(() => {
    if (!range?.startTime && !range?.endTime) {
      return deriveRangeFromGranularity(granularity);
    }
    return range;
  }, [granularity, range?.startTime, range?.endTime]);

  return useMemo(
    () => calcTownTotalsFromSeries(effectiveRange, granularity),
    [effectiveRange.startTime, effectiveRange.endTime, granularity]
  );
}

export function getTownIds(): PuebloId[] {
  return [...PUEBLOS];
}

/* ===================== KPI Overview (global) ===================== */
export type KPITotals = {
  current: Totals;
  previous: Totals;
  delta: { interactions: number; visits: number };
  pct: { interactions: number; visits: number };
};
export type KPIOverview = {
  range: TotalsRange;
  series: KPISeries;
  totals: KPITotals;
};

export function useKPIOverview(
  granularity: Granularity | null,
  range?: TotalsRange
): KPIOverview {
  // 1) Rango efectivo
  const effectiveRange = useMemo<TotalsRange>(() => {
    if (range?.startTime && range?.endTime) return range;
    if (granularity) return deriveRangeFromGranularity(granularity);
    return deriveRangeFromGranularity("m"); // fallback
  }, [granularity, range?.startTime, range?.endTime]);

  const prevRange = useMemo(
    () => comparablePreviousRange(effectiveRange),
    [effectiveRange.startTime, effectiveRange.endTime]
  );

  // 2) Totales (actual vs anterior)
  const currentTotals = useMemo(
    () => calcTotalsFromSeries(effectiveRange),
    [effectiveRange.startTime, effectiveRange.endTime]
  );
  const previousTotals = useMemo(
    () => calcTotalsFromSeries(prevRange),
    [prevRange.startTime, prevRange.endTime]
  );
  const delta = useMemo(
    () => ({
      interactions: currentTotals.interactions - previousTotals.interactions,
      visits: currentTotals.visits - previousTotals.visits,
    }),
    [currentTotals, previousTotals]
  );
  const pct = useMemo(
    () => ({
      interactions: pctChange(
        currentTotals.interactions,
        previousTotals.interactions
      ),
      visits: pctChange(currentTotals.visits, previousTotals.visits),
    }),
    [currentTotals, previousTotals]
  );

  // 3) Series (según granularidad o rango libre)
  const series = useMemo<KPISeries>(() => {
    const isFreeRange =
      !!range?.startTime && !!range?.endTime && !granularity;

    if (isFreeRange) {
      const curr = buildDailyTotalsSeries(
        effectiveRange.startTime!,
        effectiveRange.endTime!
      );
      const prev = buildDailyTotalsSeries(
        prevRange.startTime!,
        prevRange.endTime!
      );
      return { bucket: "daily", current: curr, previous: prev };
    }

    switch (granularity) {
      case "d": {
        const currDaily = buildDailyTotalsSeries(
          effectiveRange.startTime!,
          effectiveRange.endTime!
        );
        const prevDaily = buildDailyTotalsSeries(
          prevRange.startTime!,
          prevRange.endTime!
        );
        return { bucket: "day", current: currDaily, previous: prevDaily };
      }
      case "w": {
        const currDaily = buildDailyTotalsSeries(
          effectiveRange.startTime!,
          effectiveRange.endTime!
        );
        const prevDaily = buildDailyTotalsSeries(
          prevRange.startTime!,
          prevRange.endTime!
        );
        return {
          bucket: "week",
          current: aggregateWeekly(currDaily),
          previous: aggregateWeekly(prevDaily),
        };
      }
      case "y":
      case "m": {
        const currDaily = buildDailyTotalsSeries(
          effectiveRange.startTime!,
          effectiveRange.endTime!
        );
        const prevDaily = buildDailyTotalsSeries(
          prevRange.startTime!,
          prevRange.endTime!
        );
        return {
          bucket: "month",
          current: aggregateMonthly(currDaily),
          previous: aggregateMonthly(prevDaily),
        };
      }
      default: {
        const curr = buildDailyTotalsSeries(
          effectiveRange.startTime!,
          effectiveRange.endTime!
        );
        const prev = buildDailyTotalsSeries(
          prevRange.startTime!,
          prevRange.endTime!
        );
        return { bucket: "daily", current: curr, previous: prev };
      }
    }
  }, [
    granularity,
    range?.startTime,
    range?.endTime,
    effectiveRange.startTime,
    effectiveRange.endTime,
    prevRange.startTime,
    prevRange.endTime,
  ]);

  return {
    range: effectiveRange,
    series,
    totals: { current: currentTotals, previous: previousTotals, delta, pct },
  };
}

/* ===================== SECTORES (desde TAG_META) ===================== */

export type SectorId = keyof typeof TAG_META;

export type SectorInfo = {
  id: SectorId;
  label: string;
  Icon: TagMeta["icon"];
  colorClass: string; // tailwind de TAG_META.color
  hex: string; // color principal HEX (para charts/leyendas)
};

/** Lista de sectores en el mismo orden que TAG_META. */
export function listSectors(): SectorInfo[] {
  return (Object.keys(TAG_META) as SectorId[]).map((id) => {
    const meta = TAG_META[id];
    return {
      id,
      label: meta.label,
      Icon: meta.icon,
      colorClass: meta.color,
      hex: TAG_COLOR_HEX_BY_TAG[id] ?? "#4B5563",
    };
  });
}

/** Info de un sector concreto. */
export function getSectorInfo(id: SectorId): SectorInfo {
  const meta = TAG_META[id];
  return {
    id,
    label: meta.label,
    Icon: meta.icon,
    colorClass: meta.color,
    hex: TAG_COLOR_HEX_BY_TAG[id] ?? "#4B5563",
  };
}

/** Subtags de un sector: toma `sector.subtag` y `pueblo.sector.subtag`. */
export function listSubtagsForSector(sector: SectorId): string[] {
  const subtags = new Set<string>();
  for (const key of Object.keys(SERIES)) {
    const parts = key.split(".");
    if (parts.length === 2 && parts[0] === sector) {
      // sector.subtag
      subtags.add(parts[1]!);
    } else if (
      parts.length === 3 &&
      (PUEBLOS as readonly string[]).includes(parts[0]!) &&
      parts[1] === sector
    ) {
      // pueblo.sector.subtag
      subtags.add(parts[2]!);
    }
  }
  return Array.from(subtags).sort();
}

/* ---- helpers de sector ---- */
function leafKeysForSector(sector: SectorId): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(SERIES)) {
    const parts = key.split(".");
    if (parts.length === 2 && parts[0] === sector) keys.push(key);
    else if (
      parts.length === 3 &&
      (PUEBLOS as readonly string[]).includes(parts[0]!) &&
      parts[1] === sector
    )
      keys.push(key);
  }
  return keys;
}

function sumManyKeysOnDate(keys: string[], date: string): number {
  let acc = 0;
  for (const k of keys) acc += (SERIES[k]?.[date] as number | undefined) ?? 0;
  return acc;
}

/** Serie diaria (sumada) de un sector en un rango. */
export function sectorDailySeries(
  sector: SectorId,
  range: TotalsRange
): SeriesPoint[] {
  if (!range.startTime || !range.endTime) return [];
  const keys = leafKeysForSector(sector);
  const dates = dateRangeDays(range.startTime, range.endTime);
  return dates.map((d) => ({ label: d, value: sumManyKeysOnDate(keys, d) }));
}

/** Donut por subtags (sumando global+todos los pueblos) en un rango. */
export type DonutDatum = { label: string; value: number };
export function sectorSubtagTotals(
  sector: SectorId,
  range: TotalsRange
): DonutDatum[] {
  const start = range.startTime;
  const end = range.endTime;
  if (!start || !end) return [];

  const subtags = listSubtagsForSector(sector);
  const result: DonutDatum[] = [];

  for (const sub of subtags) {
    const keys: string[] = [];
    const kGlobal = `${sector}.${sub}`;
    if (SERIES[kGlobal]) keys.push(kGlobal);
    for (const town of PUEBLOS) {
      const kTown = `${town}.${sector}.${sub}`;
      if (SERIES[kTown]) keys.push(kTown);
    }
    let sum = 0;
    for (const k of keys) sum += sumKeyOverRange(k, start, end);
    result.push({ label: sub, value: sum });
  }

  result.sort((a, b) => b.value - a.value);
  return result;
}

/** Totales y % vs rango anterior para un sector completo. */
export function sectorTotalsWithDelta(
  sector: SectorId,
  range: TotalsRange
): { current: Totals; previous: Totals; pct: number } {
  const keys = leafKeysForSector(sector);
  if (!range.startTime || !range.endTime || keys.length === 0) {
    return {
      current: { interactions: 0, visits: 0 },
      previous: { interactions: 0, visits: 0 },
      pct: 0,
    };
  }

  const prev = comparablePreviousRange(range);
  const sumRange = (r: TotalsRange) => {
    let total = 0;
    for (const k of keys) total += sumKeyOverRange(k, r.startTime, r.endTime);
    const interactions = total;
    const visits = Math.round(interactions * 2.1);
    return { interactions, visits };
  };

  const current = sumRange(range);
  const previous = sumRange(prev);
  const pct = pctChange(current.interactions, previous.interactions);

  return { current, previous, pct };
}

/* ===================== Hook: Sector Overview (para card expandida) ===================== */

export type SectorSeries = {
  bucket: KPIBucket;
  current: SeriesPoint[];
  previous: SeriesPoint[];
};
export type SectorOverview = {
  range: TotalsRange;
  totals: { current: Totals; previous: Totals; pct: number };
  series: SectorSeries;
};

export function useSectorOverview(
  sector: SectorId,
  granularity: Granularity | null,
  range?: TotalsRange
): SectorOverview {
  // 1) Rango efectivo
  const effectiveRange = useMemo<TotalsRange>(() => {
    if (range?.startTime && range?.endTime) return range;
    if (granularity) return deriveRangeFromGranularity(granularity);
    return deriveRangeFromGranularity("m");
  }, [granularity, range?.startTime, range?.endTime]);

  const prevRange = useMemo(
    () => comparablePreviousRange(effectiveRange),
    [effectiveRange.startTime, effectiveRange.endTime]
  );

  // 2) Totales
  const totals = useMemo(
    () => sectorTotalsWithDelta(sector, effectiveRange),
    [sector, effectiveRange.startTime, effectiveRange.endTime]
  );

  // 3) Series
  const series = useMemo<SectorSeries>(() => {
    const isFreeRange =
      !!range?.startTime && !!range?.endTime && !granularity;

    const buildDaily = (r: TotalsRange) =>
      sectorDailySeries(sector, r);

    if (isFreeRange) {
      return {
        bucket: "daily",
        current: buildDaily(effectiveRange),
        previous: buildDaily(prevRange),
      };
    }

    switch (granularity) {
      case "d": {
        const curr = buildDaily(effectiveRange);
        const prev = buildDaily(prevRange);
        return { bucket: "day", current: curr, previous: prev };
      }
      case "w": {
        const curr = aggregateWeekly(buildDaily(effectiveRange));
        const prev = aggregateWeekly(buildDaily(prevRange));
        return { bucket: "week", current: curr, previous: prev };
      }
      case "y":
      case "m": {
        const curr = aggregateMonthly(buildDaily(effectiveRange));
        const prev = aggregateMonthly(buildDaily(prevRange));
        return { bucket: "month", current: curr, previous: prev };
      }
      default: {
        const curr = buildDaily(effectiveRange);
        const prev = buildDaily(prevRange);
        return { bucket: "daily", current: curr, previous: prev };
      }
    }
  }, [
    sector,
    granularity,
    range?.startTime,
    range?.endTime,
    effectiveRange.startTime,
    effectiveRange.endTime,
    prevRange.startTime,
    prevRange.endTime,
  ]);

  return { range: effectiveRange, totals, series };
}
