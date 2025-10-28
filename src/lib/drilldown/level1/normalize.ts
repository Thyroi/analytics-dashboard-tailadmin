import type { SeriesPoint } from "./buildLevel1.types";

// Normalization helpers for drilldown Level 1
// - Lowercase, trim, remove diacritics (NFD)
// - Collapse spaces, replace spaces with underscores for internal IDs
// - Allow ':' and '.'; strip other punctuation
// - Preserve ':' and '.' positions

const PUNCT_KEEP = new Set([":", "."]);

export function normalizeKey(input: string): string {
  if (!input) return "";
  let s = input.toLowerCase().trim();
  // NFD + remove diacritics
  s = s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  // Remove punctuation except ':' and '.'
  s = s
    .split("")
    .filter(
      (ch) =>
        /[\p{L}\p{N}\s:_\.]/u.test(ch) &&
        (/[\p{L}\p{N}\s_]/u.test(ch) || PUNCT_KEEP.has(ch))
    )
    .join("");
  // Normalize whitespace
  s = s
    .replace(/[ _-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Replace spaces with underscores for IDs
  s = s.replace(/\s+/g, "_");
  return s;
}

export function extractTailAfterScope(
  fullKey: string,
  scopeId: string,
  _scopeType: "category" | "town"
): string[] {
  // touch param to satisfy strict no-unused-vars while keeping the required signature
  const __scopeType: "category" | "town" = _scopeType;
  void __scopeType;
  if (!fullKey?.startsWith("root")) return [];
  const parts = fullKey.split(".");
  if (parts.length < 2) return [];
  // parts: [root, <scope>, <tail...>]
  const normScopeFromKey = normalizeKey(parts[1]);
  const normScopeId = normalizeKey(scopeId);
  const tailParts =
    normScopeFromKey === normScopeId ? parts.slice(2) : parts.slice(2); // be permissive
  // Normalize each segment, but keep ':' and '.' inside segments
  return tailParts.map((seg) => {
    // Normalize like normalizeKey, but do not replace spaces with '_' here (we want token matching by normalized form)
    let s = seg.toLowerCase().trim();
    s = s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    s = s
      .split("")
      .filter(
        (ch) =>
          /[\p{L}\p{N}\s:_\.]/u.test(ch) &&
          (/[\p{L}\p{N}\s_]/u.test(ch) || PUNCT_KEEP.has(ch))
      )
      .join("");
    s = s
      .replace(/[ _-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return s;
  });
}

export function matchFromAliases(
  token: string,
  entries: { id: string; aliases: string[] }[]
): { id: string } | null {
  const normToken = normalizeKey(token);
  for (const e of entries) {
    const normId = normalizeKey(e.id);
    if (normToken === normId) return { id: e.id };
    for (const a of e.aliases) {
      if (normToken === normalizeKey(a)) return { id: e.id };
    }
  }
  return null;
}

export function sumSeries(points: SeriesPoint[], mode: "sum" | "last"): number {
  if (!points || points.length === 0) return 0;
  if (mode === "last") {
    const last = points[points.length - 1];
    return last?.value ?? 0;
  }
  return points.reduce((acc, p) => acc + p.value, 0);
}

/**
 * Aggregate multiple series by time, summing values at each time point.
 * Returns a single series with all unique time points, each with summed values.
 */
export function aggregateSeriesByTime(
  seriesArray: SeriesPoint[]
): SeriesPoint[] {
  if (!seriesArray || seriesArray.length === 0) return [];

  const timeMap = new Map<string, number>();

  for (const point of seriesArray) {
    const current = timeMap.get(point.time) || 0;
    timeMap.set(point.time, current + point.value);
  }

  // Sort by time (ISO strings sort correctly lexicographically)
  return Array.from(timeMap.entries())
    .map(([time, value]) => ({ time, value }))
    .sort((a, b) => a.time.localeCompare(b.time));
}
