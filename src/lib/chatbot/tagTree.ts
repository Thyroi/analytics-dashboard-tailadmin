import type { AuditTagsOutput, SeriesPoint } from "@/features/chatbot/types/tags";

export type TagRow = {
  key: string;
  name: string;
  series: SeriesPoint[];
  total: number;
  latest: number;
  path: string[];
};

export function splitKey(key: string): string[] {
  return key.split(".").filter(Boolean);
}

export function lastSegment(key: string): string {
  const parts = splitKey(key);
  return parts[parts.length - 1] ?? key;
}

export function sumSeries(points: SeriesPoint[] | undefined): number {
  if (!points || !points.length) return 0;
  return points.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
}

export function latest(points: SeriesPoint[] | undefined): number {
  if (!points || !points.length) return 0;
  return Number(points[points.length - 1].value) || 0;
}

/** Convierte output de pattern "<prefix>.*" a lista de hijos inmediatos con métricas. */
export function childrenFromOutput(_prefix: string, output: AuditTagsOutput): TagRow[] {
  const items: TagRow[] = Object.entries(output).map(([fullKey, series]) => ({
    key: fullKey,
    name: lastSegment(fullKey),
    series,
    total: sumSeries(series),
    latest: latest(series),
    path: splitKey(fullKey),
  }));
  items.sort((a, b) => b.total - a.total);
  return items;
}

/** Aplana cualquier output a filas (útil para búsqueda transversal). */
export function flatRows(output: AuditTagsOutput): TagRow[] {
  const rows: TagRow[] = Object.entries(output).map(([fullKey, series]) => ({
    key: fullKey,
    name: lastSegment(fullKey),
    series,
    total: sumSeries(series),
    latest: latest(series),
    path: splitKey(fullKey),
  }));
  rows.sort((a, b) => b.total - a.total);
  return rows;
}
