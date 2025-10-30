/**
 * Utilidades para trabajar con dimensiones customizadas de GA4
 */

import { normalizePropertyId } from "@/lib/utils/analytics/ga";
import { analyticsdata_v1beta } from "googleapis";

/**
 * Obtiene las dimensiones customizadas disponibles en GA4
 */
export async function fetchDimensionApiNames(
  analyticsData: analyticsdata_v1beta.Analyticsdata,
  propertyId: string
): Promise<string[]> {
  const name = `${normalizePropertyId(propertyId)}/metadata`;
  const meta = await analyticsData.properties.getMetadata({ name });
  return (
    meta.data.dimensions?.map((d) => d.apiName ?? "").filter((s) => s) ?? []
  );
}

/**
 * Resuelve el nombre de una dimensión customizada de evento
 * Prueba múltiples variantes (lowercase, capitalized, original) y fallback por sufijo
 */
export function resolveCustomEventDim(
  available: string[],
  base: string
): string | undefined {
  const candidates = [
    `customEvent:${base.toLowerCase()}`,
    `customEvent:${base.charAt(0).toUpperCase()}${base.slice(1)}`,
    `customEvent:${base}`,
  ];

  const availLC = available.map((a) => a.toLowerCase());
  for (const cand of candidates) {
    const idx = availLC.indexOf(cand.toLowerCase());
    if (idx >= 0) return available[idx];
  }

  // Fallback por sufijo
  const suffix = `:${base.toLowerCase()}`;
  const idx = availLC.findIndex(
    (a) => a.startsWith("customevent:") && a.endsWith(suffix)
  );
  if (idx >= 0) return available[idx];

  return undefined;
}
