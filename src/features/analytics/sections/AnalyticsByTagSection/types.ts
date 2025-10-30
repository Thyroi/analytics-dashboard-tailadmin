import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";

export type Drill =
  | { kind: "category"; categoryId: CategoryId }
  | { kind: "town+cat"; townId: TownId; categoryId: CategoryId };

export type Level2Data = {
  townId: TownId;
  categoryId: CategoryId;
  granularity: Granularity;
  startISO: string;
  endISO: string;
};
