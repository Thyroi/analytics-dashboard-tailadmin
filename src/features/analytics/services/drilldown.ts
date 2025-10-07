import { fetchJSON } from "@/lib/api/analytics";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";

export type SubSeries = { name: string; data: number[]; path: string };

// 👇 alias para compatibilidad con componentes existentes
export type UrlSeries = SubSeries;

export type TownCategoryDrilldownResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  id: TownId;
  title: string;
  series: {
    current: { label: string; value: number }[];
    previous: { label: string; value: number }[];
  };
  xLabels: string[];
  donut: { label: string; value: number }[];
  deltaPct: number;
  seriesByUrl: SubSeries[]; // <- mantiene el shape actual
};

export async function getTownCategoryDrilldown(params: {
  townId: TownId;
  categoryId: CategoryId;
  granularity: Granularity;
  endISO?: string;
}): Promise<TownCategoryDrilldownResponse> {
  const { townId, categoryId, granularity, endISO } = params;
  const qs = new URLSearchParams({ g: granularity, categoryId });
  if (endISO) qs.set("end", endISO);

  const url = `/api/analytics/v1/dimensions/pueblos/${townId}/details?${qs.toString()}`;
  return fetchJSON<TownCategoryDrilldownResponse>(url);
}
