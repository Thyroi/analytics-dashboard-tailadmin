import type { MultiSeriesCategoriesPayload } from "../types";

export async function fetchUserActivity(params?: {
  start?: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
}): Promise<MultiSeriesCategoriesPayload> {
  const qs = new URLSearchParams();
  if (params?.start) qs.set("start", params.start);
  if (params?.end) qs.set("end", params.end);
  const url = `/api/analytics/activity${qs.toString() ? `?${qs}` : ""}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  return (await res.json()) as MultiSeriesCategoriesPayload;
}
