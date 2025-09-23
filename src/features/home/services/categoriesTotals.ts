import type { Granularity } from "@/lib/types";
import { CategoriesTotalsResponse, fetchJSON } from "@/lib/api/analytics";

/** GET /api/analytics/v1/dimensions/categorias/totals */
export async function getCategoriesTotals(input: {
  granularity: Granularity;  // "d" | "w" | "m" | "y"
  endISO?: string;
  signal?: AbortSignal;
}): Promise<CategoriesTotalsResponse> {
  const sp = new URLSearchParams({ g: input.granularity });
  if (input.endISO) sp.set("end", input.endISO);
  const url = `/api/analytics/v1/dimensions/categorias/totals?${sp.toString()}`;
  return fetchJSON<CategoriesTotalsResponse>(url, { method: "GET", signal: input.signal });
}
