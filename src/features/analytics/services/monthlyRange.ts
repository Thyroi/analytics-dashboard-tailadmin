import type { SingleMetricRangePayload } from "../types";

export async function fetchMonthlyRange(params: {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}): Promise<SingleMetricRangePayload> {
  const url = `/api/analytics/monthly-range?start=${encodeURIComponent(
    params.start
  )}&end=${encodeURIComponent(params.end)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);

  const json = (await res.json()) as unknown;
  if (!json || typeof json !== "object")
    throw new Error("Formato de respuesta inválido");
  return json as SingleMetricRangePayload;
}
