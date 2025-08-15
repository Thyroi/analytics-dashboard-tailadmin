import type { KpiPayload } from "../types";
import { isKpiPayload } from "../types";
import { getJSON } from "./_http";

export async function fetchKpis(params: { start: string; end: string }): Promise<KpiPayload> {
  const url = `/api/analytics/kpis?start=${encodeURIComponent(params.start)}&end=${encodeURIComponent(params.end)}`;
  const json = await getJSON<unknown>(url);
  if (!isKpiPayload(json)) throw new Error("Formato de respuesta inválido");
  return json;
}
