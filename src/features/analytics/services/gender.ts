import type { DonutDatum, Granularity } from "@/lib/types";

export type GenderPayload = {
  range: { start: string; end: string };
  property: string;
  items: DonutDatum[];
};

export async function fetchGender(input?: {
  start?: string;
  end?: string;
  granularity?: Granularity;
  signal?: AbortSignal;
}): Promise<GenderPayload> {
  const sp = new URLSearchParams();
  if (input?.start) sp.set("start", input.start);
  if (input?.end) sp.set("end", input.end);
  if (input?.granularity) sp.set("granularity", input.granularity);

  const url = `/api/analytics/v1/header/gender${sp.toString() ? `?${sp.toString()}` : ""}`;
  const res = await fetch(url, { method: "GET", signal: input?.signal, headers: { "cache-control": "no-cache" } });
  const data = (await res.json()) as unknown;

  if (!res.ok) {
    const msg = typeof (data as { error?: unknown })?.error === "string" ? (data as { error: string }).error : `Gender ${res.status}`;
    throw new Error(msg);
  }

  return data as GenderPayload;
}
