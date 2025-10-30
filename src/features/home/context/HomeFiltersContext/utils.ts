import type { Granularity } from "@/lib/types";
import {
  deriveAutoRangeForGranularity,
  rangeToPreset,
} from "@/lib/utils/time/datetime";
import type { Range } from "./types";

export const DEFAULT_GRANULARITY: Granularity = "d";

export function getInitialRange(
  initialGranularity: Granularity,
  initialDateFrom?: string,
  initialDateTo?: string
): Range {
  if (initialDateFrom && initialDateTo) {
    return { startTime: initialDateFrom, endTime: initialDateTo };
  }
  return rangeToPreset(deriveAutoRangeForGranularity(initialGranularity));
}

export function getRangeForGranularity(g: Granularity): Range {
  return rangeToPreset(deriveAutoRangeForGranularity(g));
}
