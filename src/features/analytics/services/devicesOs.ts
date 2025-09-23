import type { Granularity } from "@/lib/types";
import { DevicesOsResponse, fetchJSON } from "@/lib/api/analytics";

/** GET /api/analytics/v1/header/devices/os */
export async function getDevicesOs(input?: {
  start?: string;
  end?: string;
  granularity?: Granularity;
  signal?: AbortSignal;
}): Promise<DevicesOsResponse> {
  const sp = new URLSearchParams();
  if (input?.start) sp.set("start", input.start);
  if (input?.end) sp.set("end", input.end);
  if (input?.granularity) sp.set("granularity", input.granularity);

  const url = `/api/analytics/v1/header/devices/os${sp.toString() ? `?${sp.toString()}` : ""}`;
  return fetchJSON<DevicesOsResponse>(url, { method: "GET", signal: input?.signal });
}
