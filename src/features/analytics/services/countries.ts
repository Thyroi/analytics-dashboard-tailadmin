import type { CountriesPayload } from "@/lib/api/analytics"; // ver sección 3
import type { Granularity } from "@/lib/types";

type Params = {
  start?: string;
  end?: string;
  granularity?: Granularity; // "d" | "w" | "m" | "y"
  limit?: number;            // cuántos países traer (para el top y el mapa)
  signal?: AbortSignal;
};

export async function fetchCountries({
  start,
  end,
  granularity,
  limit = 100,
  signal,
}: Params): Promise<CountriesPayload> {
  const sp = new URLSearchParams();
  if (start) sp.set("start", start);
  if (end) sp.set("end", end);
  if (granularity) sp.set("granularity", granularity);
  if (limit) sp.set("limit", String(limit));

  const resp = await fetch(
    `/api/analytics/v1/header/countries?` + sp.toString(),
    { method: "GET", signal, headers: { "content-type": "application/json" }, cache: "no-store" }
  );

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(txt || `HTTP ${resp.status}`);
  }

  return resp.json() as Promise<CountriesPayload>;
}
