import type { RegionsPayload } from "@/app/api/analytics/v1/header/countries/[country]/regions/route";
import type { Granularity } from "@/lib/types";

type Params = {
  country: string; // ISO-2
  start?: string;
  end?: string;
  granularity?: Granularity;
  limit?: number;
  signal?: AbortSignal;
};

export async function fetchCountryRegions({
  country,
  start,
  end,
  granularity,
  limit = 100,
  signal,
}: Params): Promise<RegionsPayload> {
  const sp = new URLSearchParams();
  if (start) sp.set("start", start);
  if (end) sp.set("end", end);
  if (granularity) sp.set("granularity", granularity);
  if (limit) sp.set("limit", String(limit));

  const resp = await fetch(
    `/api/analytics/v1/header/countries/${country}/regions?${sp.toString()}`,
    {
      method: "GET",
      signal,
      headers: { "content-type": "application/json" },
      cache: "no-store",
    }
  );

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(txt || `HTTP ${resp.status}`);
  }
  return resp.json() as Promise<RegionsPayload>;
}
