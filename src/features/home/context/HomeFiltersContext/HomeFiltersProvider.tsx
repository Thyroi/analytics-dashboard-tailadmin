"use client";

import type { Granularity, SliceName } from "@/lib/types";
import { useCallback, useMemo } from "react";
import { HomeFiltersContext } from "./context";
import type {
  HomeFiltersContextValue,
  HomeFiltersProviderProps,
} from "./types";
import { useSliceState } from "./useSliceState";
import { DEFAULT_GRANULARITY, getInitialRange } from "./utils";

export function HomeFiltersProvider({
  children,
  initialGranularity = DEFAULT_GRANULARITY,
  initialDateFrom,
  initialDateTo,
}: HomeFiltersProviderProps) {
  const initialRange = getInitialRange(
    initialGranularity,
    initialDateFrom,
    initialDateTo
  );

  const users = useSliceState(initialGranularity, initialRange);
  const interactions = useSliceState(initialGranularity, initialRange);

  const applyGranularityPreset = useCallback(
    (slice: SliceName, g: Granularity) => {
      if (slice === "users") {
        users.applyGranularityPreset(g);
      } else {
        interactions.applyGranularityPreset(g);
      }
    },
    [users, interactions]
  );

  const value: HomeFiltersContextValue = useMemo(
    () => ({
      users: users.state,
      interactions: interactions.state,
      setUsersGranularity: users.setGranularity,
      setUsersRange: users.setRange,
      resetUsers: users.reset,
      setInteractionsGranularity: interactions.setGranularity,
      setInteractionsRange: interactions.setRange,
      resetInteractions: interactions.reset,
      applyUsersGranularityPreset: users.applyGranularityPreset,
      applyInteractionsGranularityPreset: interactions.applyGranularityPreset,
      applyGranularityPreset,
    }),
    [users, interactions, applyGranularityPreset]
  );

  return (
    <HomeFiltersContext.Provider value={value}>
      {children}
    </HomeFiltersContext.Provider>
  );
}
