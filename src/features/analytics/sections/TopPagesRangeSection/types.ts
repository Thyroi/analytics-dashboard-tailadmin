import type { Granularity } from "@/lib/types";

export type LegacyPayload = { categoriesLabels?: string[] };

export interface ChartConfig {
  granularity: Granularity;
  startISO?: string;
  endISO?: string;
}
