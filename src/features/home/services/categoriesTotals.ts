"use client";

import { CATEGORY_META, type CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";

/** Item normalizado para UI */
export type CategoryTotalsItem = {
  id: CategoryId;
  title: string;
  total: number;
  /** Puede ser null cuando no hay base de comparación */
  deltaPct: number | null;
};

/** Respuesta normalizada para UI */
export type CategoriesTotalsResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  items: CategoryTotalsItem[];
};

/** Shape crudo del endpoint */
type RawTotals = {
  currentTotal: number;
  previousTotal: number;
  deltaPct: number | null;
};
type RawResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  categories: string[]; // ids
  perCategory: Record<string, RawTotals>;
};

export async function getCategoriesTotals(
  granularity: Granularity,
  endISO?: string
): Promise<CategoriesTotalsResponse> {
  const qs = new URLSearchParams({ g: granularity });
  if (endISO) qs.set("end", endISO);

  const url = `/api/analytics/v1/dimensions/categorias/totals?${qs.toString()}`;

  const resp = await fetch(url, {
    method: "GET",
    headers: { "cache-control": "no-cache" },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `HTTP ${resp.status}`);
  }

  const raw = (await resp.json()) as RawResponse;

  // perCategory (diccionario) → items[]
  const items: CategoryTotalsItem[] = Object.keys(raw.perCategory)
    .filter((id): id is CategoryId =>
      Object.prototype.hasOwnProperty.call(CATEGORY_META, id)
    )
    .map((id) => {
      const k = raw.perCategory[id];
      const total = Number.isFinite(k.currentTotal) ? k.currentTotal : 0;
      const deltaPct =
        typeof k.deltaPct === "number" && Number.isFinite(k.deltaPct)
          ? k.deltaPct
          : null;
      const title = CATEGORY_META[id].label ?? id;
      return { id, title, total, deltaPct };
    });

  return {
    granularity: raw.granularity,
    range: raw.range,
    items,
  };
}
