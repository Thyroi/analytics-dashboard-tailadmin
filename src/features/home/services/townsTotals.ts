"use client";

import { TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";

/** Item normalizado para UI */
export type TownTotalsItem = {
  id: TownId;
  currentTotal: number;
  previousTotal: number;
  /** Puede ser null cuando no hay base de comparación */
  deltaPct: number | null;
};

export type TownsTotalsUIResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  items: TownTotalsItem[];
};

/** Shape crudo del endpoint */
type RawPerTown = Record<
  string,
  { currentTotal: number; previousTotal: number; deltaPct: number | null }
>;
type RawResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  perTown?: RawPerTown;
};

function isTownId(id: string): id is TownId {
  return Object.prototype.hasOwnProperty.call(TOWN_META, id);
}

/** GET /api/analytics/v1/dimensions/pueblos/totals */
export async function getTownsTotals(input: {
  granularity: Granularity; // "d" | "w" | "m" | "y"
  endISO?: string;
  signal?: AbortSignal;
}): Promise<TownsTotalsUIResponse> {
  const sp = new URLSearchParams({ g: input.granularity });
  if (input.endISO) sp.set("end", input.endISO);

  const url = `/api/analytics/v1/dimensions/pueblos/totals?${sp.toString()}`;

  const resp = await fetch(url, {
    method: "GET",
    signal: input.signal,
    headers: { "cache-control": "no-cache" },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `HTTP ${resp.status}`);
  }

  const raw = (await resp.json()) as RawResponse;
  const perTown: RawPerTown = raw.perTown ?? {};

  const items: TownTotalsItem[] = Object.keys(perTown)
    .filter(isTownId)
    .map((id) => {
      const v = perTown[id];
      return {
        id,
        currentTotal: Number.isFinite(v.currentTotal) ? v.currentTotal : 0,
        previousTotal: Number.isFinite(v.previousTotal) ? v.previousTotal : 0,
        deltaPct:
          typeof v.deltaPct === "number" && Number.isFinite(v.deltaPct)
            ? v.deltaPct
            : null,
      };
    });

  return {
    granularity: raw.granularity,
    range: raw.range,
    items,
  };
}
