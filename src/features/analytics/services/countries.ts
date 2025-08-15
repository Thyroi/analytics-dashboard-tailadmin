import type { CountriesPayload } from "../types";

export async function fetchCountries(params: {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  limit?: number;
}): Promise<CountriesPayload> {
  const qs = new URLSearchParams({
    start: params.start,
    end: params.end,
    ...(params.limit ? { limit: String(params.limit) } : {}),
  });
  const url = `/api/analytics/countries?${qs.toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);

  const json = (await res.json()) as unknown;
  if (!json || typeof json !== "object")
    throw new Error("Formato de respuesta inválido");
  return json as CountriesPayload;
}
