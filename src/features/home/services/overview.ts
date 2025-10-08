import { buildQS, fetchJSON } from "@/lib/api/analytics";
import type { DateRange, Granularity } from "@/lib/types";

type Point = { label: string; value: number };
type OverviewResponseServer = {
  meta: {
    range: {
      current: { start: string; end: string };
      previous: { start: string; end: string };
    };
    granularity: Granularity;
    timezone: "UTC";
    source: string;
    property: string;
  };
  totals: {
    users: number;
    usersPrev: number;
    interactions: number;
    interactionsPrev: number;
  };
  series: {
    usersByBucket: Point[];
    usersByBucketPrev: Point[];
    interactionsByBucket: Point[];
    interactionsByBucketPrev: Point[];
  };
};

export type OverviewResponse = {
  meta: OverviewResponseServer["meta"];
  totals: OverviewResponseServer["totals"];
  series: OverviewResponseServer["series"];
};

function normalizeOverviewResponse(
  input: OverviewResponseServer
): OverviewResponse {
  return {
    meta: input.meta,
    totals: input.totals,
    series: input.series,
  };
}

export async function getOverview(input: {
  range?: DateRange;
  granularity: Granularity;
  signal?: AbortSignal;
}): Promise<OverviewResponse> {
  const g = input.granularity;
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
