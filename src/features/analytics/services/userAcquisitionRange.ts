import type { AcquisitionRangePayload } from "../types";

export async function fetchUserAcquisitionRange(params: {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}): Promise<AcquisitionRangePayload> {
  const url = `/api/analytics/user-acquisition-range?start=${encodeURIComponent(
    params.start,
  )}&end=${encodeURIComponent(params.end)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);

  const json = (await res.json()) as unknown;
  if (!json || typeof json !== "object") {
    throw new Error("Formato de respuesta inválido");
  }
  // Confiamos en el backend (shape estable); si quieres, aquí puedes validar campos.
  return json as AcquisitionRangePayload;
}
