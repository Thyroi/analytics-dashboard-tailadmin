// src/lib/analytics/ga4.ts
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { groupFromDailyMaps } from "@/lib/utils/charts";
import {
  deriveRangeEndingYesterday,
  parseISO,
  prevComparable,
  todayUTC,
} from "@/lib/utils/datetime";
import { normalizePath, safePathname, stripLangPrefix } from "@/lib/utils/url";
import type { GoogleAuth } from "google-auth-library";
import { analyticsdata_v1beta, google } from "googleapis";

/* ---------------- tipos compartidos ---------------- */
export type DateRange = { start: string; end: string };
export type Ranges = { current: DateRange; previous: DateRange };

/* ---------------- rangos comparables ---------------- */
export function buildComparableRanges(
  g: Granularity,
  endISO?: string,
  dayAsWeek = false
): Ranges {
  const now = endISO ? parseISO(endISO) : todayUTC();
  const curr = deriveRangeEndingYesterday(g, now, dayAsWeek);
  const prev = prevComparable(curr);
  return {
    current: { start: curr.startTime, end: curr.endTime },
    previous: { start: prev.startTime, end: prev.endTime },
  };
}

/* ---------------- fechas/series ---------------- */
export function yyyymmddToISO(s: string): string {
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/** Acumula métricas *diarias* separadas en current/previous */
export function rowsToDailyMaps(
  rows: analyticsdata_v1beta.Schema$Row[] | undefined,
  ranges: Ranges,
  cfg: {
    dateDimIndex?: number; // default 0
    pageLocDimIndex?: number; // default 1
    metricIndex?: number; // default 0
    /** sólo si quieres filtrar por path exacto (ignorando /final e idioma) */
    onlyForPath?: string;
  } = {}
) {
  const dateIdx = cfg.dateDimIndex ?? 0;
  const locIdx = cfg.pageLocDimIndex ?? 1;
  const metricIdx = cfg.metricIndex ?? 0;

  const curr = new Map<string, number>();
  const prev = new Map<string, number>();
  const rr = rows ?? [];

  const targetPath =
    typeof cfg.onlyForPath === "string"
      ? stripLangPrefix(normalizePath(cfg.onlyForPath)).path.replace(
          /\/+$/,
          ""
        ) || "/"
      : null;

  for (const r of rr) {
    const dims = r.dimensionValues ?? [];
    const mets = r.metricValues ?? [];

    const dRaw = String(dims[dateIdx]?.value ?? "");
    if (dRaw.length !== 8) continue;
    const iso = yyyymmddToISO(dRaw);

    if (targetPath) {
      const loc = String(dims[locIdx]?.value ?? "");
      const onlyPath =
        stripLangPrefix(normalizePath(loc)).path.replace(/\/+$/, "") || "/";
      if (onlyPath !== targetPath) continue;
    }

    const val = Number(mets[metricIdx]?.value ?? 0);

    if (iso >= ranges.current.start && iso <= ranges.current.end) {
      curr.set(iso, (curr.get(iso) ?? 0) + val);
    } else if (iso >= ranges.previous.start && iso <= ranges.previous.end) {
      prev.set(iso, (prev.get(iso) ?? 0) + val);
    }
  }

  return { curr, prev };
}

/** rows → series agregadas por granularidad (usa groupFromDailyMaps) */
export function rowsToSeries(
  g: Granularity,
  ranges: Ranges,
  rows: analyticsdata_v1beta.Schema$Row[] | undefined,
  cfg?: Parameters<typeof rowsToDailyMaps>[2]
): { current: SeriesPoint[]; previous: SeriesPoint[] } {
  const { curr, prev } = rowsToDailyMaps(rows, ranges, cfg);
  const { series } = groupFromDailyMaps(g, ranges, curr, prev);
  return series;
}

/* ---------------- tokens/regex para FULL_REGEXP ---------------- */

export function normalizeTokenSource(s: string): string[] {
  const base = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const kebab = base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const compact = base.replace(/[^a-z0-9]+/g, "");
  return Array.from(new Set([kebab, compact]));
}

export function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Construye un FULL_REGEXP para una entidad (id+label) tipo /pueblos/ o /categorías/ */
export function fullRegexpForIdLabel(id: string, label: string): string {
  const alts = [...normalizeTokenSource(label), id.toLowerCase()].map(escapeRe);
  const host = "^https?://[^/]+";
  const pathAlt = `(?:/(?:${alts.join("|")})(?:/|$)|[-_](?:${alts.join(
    "|"
  )})[-_]|${alts.join("|")})`;
  return `${host}.*${pathAlt}.*`;
}

/** Construye un FULL_REGEXP para N entidades (ids+labels) */
export function fullRegexpForMany(
  items: Array<{ id: string; label: string }>
): string {
  const host = "^https?://[^/]+";
  const parts: string[] = [];
  for (const it of items) {
    const alts = [...normalizeTokenSource(it.label), it.id.toLowerCase()].map(
      escapeRe
    );
    parts.push(
      `(?:/(?:${alts.join("|")})(?:/|$)|[-_](?:${alts.join(
        "|"
      )})[-_]|${alts.join("|")})`
    );
  }
  return `${host}.*(?:${parts.join("|")}).*`;
}

/** Clasifica un path por tokens; devuelve key (label o id) o null */
export function classifyByTokens<T extends string>(
  rawPath: string,
  dict: Record<T, string[]>
): T | null {
  const path = safePathname(rawPath).toLowerCase();
  for (const key in dict) {
    const toks = dict[key as T];
    const hit = toks.some(
      (t) =>
        path.includes(`/${t}/`) ||
        path.endsWith(`/${t}`) ||
        path.includes(`-${t}-`) ||
        path.includes(`_${t}_`) ||
        path.includes(t)
    );
    if (hit) return key as T;
  }
  return null;
}

/** Crea tokens por id/label → para usar en classifyByTokens */
export function buildTokensDict<T extends string>(
  entries: Array<{ id: T; label: string }>
): Record<T, string[]> {
  const out = {} as Record<T, string[]>;
  for (const { id, label } of entries) {
    out[id] = Array.from(
      new Set([...normalizeTokenSource(label), id.toLowerCase()])
    );
  }
  return out;
}

/** Donut por tokens (sólo rango current) */
export function donutByTokens<T extends string>(
  rows: analyticsdata_v1beta.Schema$Row[] | undefined,
  ranges: Ranges,
  dict: Record<T, string[]>,
  cfg: {
    dateDimIndex?: number;
    pageLocDimIndex?: number;
    metricIndex?: number;
  } = {}
): DonutDatum[] {
  const dateIdx = cfg.dateDimIndex ?? 0;
  const locIdx = cfg.pageLocDimIndex ?? 1;
  const metricIdx = cfg.metricIndex ?? 0;

  const rr = rows ?? [];
  const totals = new Map<T, number>(); // ✅ evita el problema del Record<>

  for (const r of rr) {
    const dims = r.dimensionValues ?? [];
    const mets = r.metricValues ?? [];

    const dRaw = String(dims[dateIdx]?.value ?? "");
    if (dRaw.length !== 8) continue;
    const iso = yyyymmddToISO(dRaw);
    if (iso < ranges.current.start || iso > ranges.current.end) continue;

    const loc = String(dims[locIdx]?.value ?? "");
    const path = safePathname(loc);
    const val = Number(mets[metricIdx]?.value ?? 0);

    const key = classifyByTokens(path, dict);
    if (key) totals.set(key, (totals.get(key) ?? 0) + val);
  }

  return Array.from(totals.entries())
    .map(([label, value]) => ({ label: String(label), value }))
    .sort((a, b) => b.value - a.value);
}

/* ---------------- filtros GA comunes ---------------- */
export function eventNameEquals(
  name = "page_view"
): analyticsdata_v1beta.Schema$FilterExpression {
  return {
    filter: {
      fieldName: "eventName",
      stringFilter: { matchType: "EXACT", value: name, caseSensitive: false },
    },
  };
}

/* ---------------- azucar para GA client ---------------- */
export function analyticsClient(auth: GoogleAuth) {
  return google.analyticsdata({ version: "v1beta", auth });
}
