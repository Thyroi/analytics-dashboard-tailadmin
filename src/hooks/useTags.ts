"use client";

import {
  childrenPattern,
  makeBody,
  postAuditTags,
  searchTokenPattern,
} from "@/features/chatbot/services/mindsAic";
import type {
  AuditTagsResponse,
} from "@/features/chatbot/types/tags";
import { SERIES, getLastDate } from "@/lib/mockData";
import { useEffect, useMemo, useState } from "react";
import type { Granularity } from "@/lib/chatbot/tags";

export type QueryBase = {
  granularity: Granularity;
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
  const t = prefix
    .trim()
    .replace(/\.+$/g, "")
    .replace(/\.{2,}/g, ".");
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

/* ============ API hooks ============ */
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

/* ============ Totales desde SERIES ============ */
function addDaysISO(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function deriveRangeFromGranularity(g: Granularity): TotalsRange {
  const end = getLastDate(SERIES);        // último día disponible en SERIES
  switch (g) {
    case "d": {
      const start = end;                   // solo ese día
      return { startTime: start, endTime: end };
    }
    case "w": {
      const start = addDaysISO(end, -6);   // últimos 7 días
      return { startTime: start, endTime: end };
    }
    case "m": {
      const start = addDaysISO(end, -29);  // últimos 30 días
      return { startTime: start, endTime: end };
    }
    case "y": {
      const start = addDaysISO(end, -364); // últimos 365 días
      return { startTime: start, endTime: end };
    }
    default: {
      // fallback: sin límites
      return {};
    }
  }
}
export type TotalsRange = { startTime?: string; endTime?: string };
export type Totals = { interactions: number; visits: number };

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
function sumKeyOverRange(key: string, start?: string, end?: string): number {
  const s = SERIES[key];
  if (!s) return 0;
  let acc = 0;
  for (const [date, value] of Object.entries(s)) {
    if (isInRange(date, start, end)) acc += value as number;
  }
  return acc;
}

export function calcTotalsFromSeries(range?: TotalsRange): Totals {
  const start = range?.startTime;
  const end = range?.endTime;
  const keys = Object.keys(SERIES);
  const townLeafKeys = keys.filter(isTownLeafKey);
  const baseKeys = townLeafKeys.length
    ? townLeafKeys
    : keys.filter(isGlobalLeafKey);
  const interactions = baseKeys.reduce(
    (acc, k) => acc + sumKeyOverRange(k, start, end),
    0
  );
  const visits = Math.round(interactions * 2.1);
  return { interactions, visits };
}

export function useTotals(range?: TotalsRange, granularity?: Granularity): Totals {
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
  // incluye cualquier nivel: town.*, town.*.*, etc.
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
      acc += value as number;
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

  // orden descendente por interacciones
  rows.sort((a, b) => b.interactions - a.interactions);
  return rows;
}

/** Hook para totales por pueblo */
export function useTownTotals(
  granularity: Granularity,
  range?: TotalsRange
): TownTotals[] {
  const effectiveRange = useMemo<TotalsRange>(() => {
    // Si NO te pasan rango, deriva uno según la granularidad
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


/** Helper por si solo quieres la lista de IDs de pueblos */
export function getTownIds(): PuebloId[] {
  return [...PUEBLOS];
}

