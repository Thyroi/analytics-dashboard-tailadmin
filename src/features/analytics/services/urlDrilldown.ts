import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";

export type UrlDrilldownResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  context: { path: string };
  seriesAvgEngagement: { current: SeriesPoint[]; previous: SeriesPoint[] };
  kpis: {
    current: {
      activeUsers: number;
      userEngagementDuration: number;
      newUsers: number;
      eventCount: number;
      sessions: number;
      averageSessionDuration: number;
      avgEngagementPerUser: number;
      eventsPerSession: number;
    };
    previous: {
      activeUsers: number;
      userEngagementDuration: number;
      newUsers: number;
      eventCount: number;
      sessions: number;
      averageSessionDuration: number;
      avgEngagementPerUser: number;
      eventsPerSession: number;
    };
    deltaPct: {
      activeUsers: number;
      newUsers: number;
      eventCount: number;
      sessions: number;
      averageSessionDuration: number;
      avgEngagementPerUser: number;
      eventsPerSession: number;
    };
  };
  operatingSystems: DonutDatum[];
  genders: DonutDatum[];
  countries: DonutDatum[];
  deltaPct: number;
};

export async function getUrlDrilldown(args: {
  path: string;
  granularity: Granularity;
  endISO?: string;
  signal?: AbortSignal;
  dayAsWeek?: boolean; // 👈 NUEVO
}): Promise<UrlDrilldownResponse> {
  const { path, granularity, endISO, signal, dayAsWeek } = args;
  const qs = new URLSearchParams({ g: granularity, path });
  if (endISO) qs.set("end", endISO);
  if (granularity === "d" && dayAsWeek) qs.set("dw", "1"); // 👈

  const res = await fetch(`/api/analytics/v1/drilldown/url?${qs.toString()}`, {
    method: "GET",
    headers: { "cache-control": "no-cache" },
    signal,
  });

  if (!res.ok) {
    const raw = await res.json().catch(() => ({}));
    const message =
      typeof (raw as { error?: string })?.error === "string"
        ? (raw as { error?: string }).error
        : `HTTP ${res.status}`;
    throw new Error(message);
  }
  return (await res.json()) as UrlDrilldownResponse;
}
