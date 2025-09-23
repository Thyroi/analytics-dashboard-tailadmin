import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

export type UrlDrilldownResponse = {
  granularity: Granularity;
  range: { current: { start: string; end: string }; previous: { start: string; end: string } };
  context: { path: string };
  seriesAvgEngagement: { current: SeriesPoint[]; previous: SeriesPoint[] }; // segundos
  devices: DonutDatum[];
  genders: DonutDatum[];
  countries: DonutDatum[];
  deltaPct: number;
};

export async function getUrlDrilldown(args: {
  path: string;
  granularity: Granularity;
  endISO?: string;
  signal?: AbortSignal;
}): Promise<UrlDrilldownResponse> {
  const { path, granularity, endISO, signal } = args;
  const qs = new URLSearchParams({ g: granularity, path });
  if (endISO) qs.set("end", endISO);

  const res = await fetch(`/api/analytics/v1/drilldown/url?${qs.toString()}`, {
    method: "GET",
    headers: { "cache-control": "no-cache" },
    signal,
  });

  if (!res.ok) {
    const raw = await res.json().catch(() => ({}));
    const message = typeof raw?.error === "string" ? raw.error : `HTTP ${res.status}`;
    throw new Error(message);
  }
  return (await res.json()) as UrlDrilldownResponse;
}
