import type { Granularity } from "@/lib/types";
import { TownsTotalsResponse, fetchJSON } from "@/lib/api/analytics";

/** GET /api/analytics/v1/dimensions/pueblos/totals */
export async function getTownsTotals(input: {
  granularity: Granularity;  // "d" | "w" | "m" | "y"
  endISO?: string;
  signal?: AbortSignal;
}): Promise<TownsTotalsResponse> {
  const sp = new URLSearchParams({ g: input.granularity });
  if (input.endISO) sp.set("end", input.endISO);
  const url = `/api/analytics/v1/dimensions/pueblos/totals?${sp.toString()}`;
  return fetchJSON<TownsTotalsResponse>(url, { method: "GET", signal: input.signal });
}
