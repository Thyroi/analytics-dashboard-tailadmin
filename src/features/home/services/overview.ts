import type { Granularity, DateRange } from "@/lib/types";
import type { OverviewResponse } from "@/lib/api/analytics";
import { buildQS, fetchJSON } from "@/lib/api/analytics";
import { deriveAutoRangeForGranularity, todayUTC } from "@/lib/utils/datetime";

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

function normalizeOverviewResponse(input: OverviewResponseServer): OverviewResponse {
  const range =
    hasStartEnd(input.meta.range)
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
  range?: DateRange;        // si no viene => últimos 7 días (rolling)
  granularity: Granularity; // "d" | "w" | "m" | "y"
  signal?: AbortSignal;
}): Promise<OverviewResponse> {
  // fallback con tus helpers (preserva rolling y presets)
  const auto = deriveAutoRangeForGranularity("d", todayUTC(), { mode: "rolling" });

  const resolved = input.range?.startTime && input.range?.endTime
    ? { start: input.range.startTime, end: input.range.endTime }
    : { start: auto.startTime, end: auto.endTime };

  // Si tu backend aún no soporta 'y', mapeamos a 'm'. Mantén esto si aplica.
  const g = input.granularity === "y" ? "m" : input.granularity;

  const qs = buildQS({ start: resolved.start, end: resolved.end, granularity: g });
  const url = `/api/analytics/v1/overview?${qs}`;
  const raw = await fetchJSON<OverviewResponseServer>(url, { method: "GET", signal: input.signal });
  return normalizeOverviewResponse(raw);
}
