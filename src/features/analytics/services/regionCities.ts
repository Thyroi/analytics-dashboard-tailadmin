import type { CitiesPayload } from "@/app/api/analytics/v1/header/countries/[country]/regions/[region]/cities/route";
import type { Granularity } from "@/lib/types";

type Params = {
  country: string; // ISO-2
  region: string; // nombre exacto de GA4 (URL-encoded en la ruta)
  start?: string;
  end?: string;
  granularity?: Granularity;
  limit?: number;
  signal?: AbortSignal;
};

export async function fetchRegionCities({
  country,
  region,
  start,
  end,
  granularity,
  limit = 100,
  signal,
}: Params): Promise<CitiesPayload> {
  const sp = new URLSearchParams();
  if (start) sp.set("start", start);
  if (end) sp.set("end", end);
  if (granularity) sp.set("granularity", granularity);
  if (limit) sp.set("limit", String(limit));

  const regionPath = encodeURIComponent(region);

  const resp = await fetch(
    `/api/analytics/v1/header/countries/${country}/regions/${regionPath}/cities?${sp.toString()}`,
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
  return resp.json() as Promise<CitiesPayload>;
}
