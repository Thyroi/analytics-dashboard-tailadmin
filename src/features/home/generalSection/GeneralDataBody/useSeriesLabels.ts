import type { Granularity } from "@/lib/types";
import { getSeriesLabels } from "@/lib/utils/charts/tooltipLabels";
import { useMemo } from "react";

export function useSeriesLabels(granularity: Granularity) {
  return useMemo(() => getSeriesLabels(granularity), [granularity]);
}
