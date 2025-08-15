import type { MultiSeriesCategoriesPayload } from "../types";

export async function fetchMonthlyVisits(): Promise<MultiSeriesCategoriesPayload> {
  const url = "/api/analytics/monthly";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  const json = (await res.json()) as unknown;
  if (!json || typeof json !== "object")
    throw new Error("Formato de respuesta inválido");
  return json as MultiSeriesCategoriesPayload;
}
