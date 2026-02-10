import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";

export type TownCategoryDrilldownPanelProps = {
  townId: TownId;
  categoryId: CategoryId;
  granularity: Granularity;
  headline: "town" | "category";
  headlinePercent?: number;
  color?: "dark" | "primary" | "secondary";
  /** Inicio del rango (YYYY-MM-DD) */
  startISO?: string;
  /** Fin del rango (YYYY-MM-DD) */
  endISO?: string;
  onCloseLevel2?: () => void;
};

export type DayData = {
  categories: string[];
  groupedSeries: Array<{ name: string; data: Array<number | null> }>;
  donut: Array<{ id: string; label: string; value: number }>;
  deltaPct: number;
  seriesByUrl: Array<{ name: string; path: string; data: number[] }>;
};
