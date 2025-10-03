import type { OverviewResponse } from "@/lib/api/analytics";
import { buildQS, fetchJSON } from "@/lib/api/analytics";
import type { DateRange, Granularity } from "@/lib/types";

/* ----- tipos mínimos del payload server para normalizar ----- */
type MetaRangeStartEnd = { start: string; end: string };
type MetaRangeStartTimeEndTime = { startTime: string; endTime: string };
type OverviewResponseServer = {
  meta: {
    range: MetaRangeStartEnd | MetaRangeStartTimeEndTime;
    granularity: Granularity;
    timezone: "UTC";
    source: "wpideanto";
    property: string;
  };
  totals: { users: number; interactions: number };
  series: {
    usersByBucket: Array<{ label: string; value: number }>;
    interactionsByBucket: Array<{ label: string; value: number }>;
  };
};

function hasStartEnd(
  r: MetaRangeStartEnd | MetaRangeStartTimeEndTime
): r is MetaRangeStartEnd {
  return "start" in r && "end" in r;
}

function normalizeOverviewResponse(
  input: OverviewResponseServer
): OverviewResponse {
  const range = hasStartEnd(input.meta.range)
    ? { startTime: input.meta.range.start, endTime: input.meta.range.end }
    : input.meta.range;

  return {
    meta: {
      range,
      granularity: input.meta.granularity,
      timezone: input.meta.timezone,
      source: input.meta.source,
      property: input.meta.property,
    },
    totals: input.totals,
    series: input.series,
  };
}

/** GET /api/analytics/v1/overview */
export async function getOverview(input: {
  range?: DateRange; // si no viene => el server deriva (terminando AYER)
  granularity: Granularity; // "d" | "w" | "m" | "y" (y -> m)
  signal?: AbortSignal;
}): Promise<OverviewResponse> {
  // El server solo soporta d/w/m; mapeamos 'y' a 'm'
  const g = input.granularity === "y" ? "m" : input.granularity;

  // Si NO nos pasan range, NO enviamos start/end => que el server aplique deriveRangeEndingYesterday
  const qs = buildQS({
    ...(input.range?.startTime && input.range?.endTime
      ? { start: input.range.startTime, end: input.range.endTime }
      : {}),
    granularity: g,
  });

  const url = `/api/analytics/v1/overview?${qs}`;
  const raw = await fetchJSON<OverviewResponseServer>(url, {
    method: "GET",
    signal: input.signal,
  });
  return normalizeOverviewResponse(raw);
}
