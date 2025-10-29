"use client";

import { createTimeContext } from "./createTimeContext";

// Export types
export type { TimeframeContextValue } from "./types";

// Tag Analytics Context
export const {
  Provider: TagTimeProvider,
  useTimeframe: useTagTimeframe,
  Context: TagTimeContext,
} = createTimeContext("Tag");

// Town Analytics Context
export const {
  Provider: TownTimeProvider,
  useTimeframe: useTownTimeframe,
  Context: TownTimeContext,
} = createTimeContext("Town");

// Header Analytics Context (with startISO always available)
export const {
  Provider: HeaderAnalyticsTimeProvider,
  useTimeframe: useHeaderAnalyticsTimeframe,
  Context: HeaderAnalyticsTimeContext,
} = createTimeContext("HeaderAnalytics");

// General Timeframe Context
export const {
  Provider: TimeframeProvider,
  useTimeframe: useTimeframe,
  Context: TimeframeContext,
} = createTimeContext("General");
