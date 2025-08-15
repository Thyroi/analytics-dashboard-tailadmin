import type { DevicesOsPayload } from "../types";

export async function fetchDevicesOs(params?: {
  start?: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
}): Promise<DevicesOsPayload> {
  const qs = new URLSearchParams();
  if (params?.start) qs.set("start", params.start);
  if (params?.end) qs.set("end", params.end);
  const url = `/api/analytics/devices-os${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);

  const json = (await res.json()) as unknown;
  if (!json || typeof json !== "object")
    throw new Error("Formato de respuesta inválido");
  return json as DevicesOsPayload;
}
