import type { MultiSeriesCategoriesPayload } from "../types";
import type { UserActivityParams } from "../server/userActivity";

export async function fetchUserActivity(
  params?: UserActivityParams
): Promise<MultiSeriesCategoriesPayload> {
  const qs = new URLSearchParams();
  if (params?.start)  qs.set("start", params.start);
  if (params?.end)    qs.set("end", params.end);
  if (params?.source) qs.set("source", params.source);

  const url = `/api/analytics/activity${qs.toString() ? `?${qs}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as MultiSeriesCategoriesPayload;
}
