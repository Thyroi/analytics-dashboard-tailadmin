"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import type { Granularity, SliceName } from "@/lib/types";
import { deriveAutoRangeForGranularity } from "@/lib/utils/datetime";

type Range = { startTime: string; endTime: string };

type SliceState = {
  granularity: Granularity;
  range: Range;
};

type Ctx = {
  users: SliceState;
  interactions: SliceState;

  // setters “simples”
  setUsersGranularity: (g: Granularity) => void;
  setUsersRange: (r: Range) => void;
  resetUsers: () => void;

  setInteractionsGranularity: (g: Granularity) => void;
  setInteractionsRange: (r: Range) => void;
  resetInteractions: () => void;

  // ✅ aplicar preset auto-rango al cambiar granularidad
  applyUsersGranularityPreset: (g: Granularity) => void;
  applyInteractionsGranularityPreset: (g: Granularity) => void;
  applyGranularityPreset: (slice: SliceName, g: Granularity) => void;
};

const HomeFiltersContext = createContext<Ctx | null>(null);

const DEFAULT_GRANULARITY: Granularity = "m";
const DEFAULT_USERS: SliceState = {
  granularity: DEFAULT_GRANULARITY,
  range: deriveAutoRangeForGranularity(DEFAULT_GRANULARITY),
};
const DEFAULT_INTERACTIONS: SliceState = {
  granularity: DEFAULT_GRANULARITY,
  range: deriveAutoRangeForGranularity(DEFAULT_GRANULARITY),
};

export function HomeFiltersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<SliceState>(DEFAULT_USERS);
  const [interactions, setInteractions] = useState<SliceState>(DEFAULT_INTERACTIONS);

  // setters simples
  const setUsersGranularity = useCallback((g: Granularity) => {
    setUsers((s) => ({ ...s, granularity: g }));
  }, []);
  const setUsersRange = useCallback((r: Range) => {
    setUsers((s) => ({ ...s, range: r }));
  }, []);
  const resetUsers = useCallback(() => {
    setUsers({
      granularity: DEFAULT_GRANULARITY,
      range: deriveAutoRangeForGranularity(DEFAULT_GRANULARITY),
    });
  }, []);

  const setInteractionsGranularity = useCallback((g: Granularity) => {
    setInteractions((s) => ({ ...s, granularity: g }));
  }, []);
  const setInteractionsRange = useCallback((r: Range) => {
    setInteractions((s) => ({ ...s, range: r }));
  }, []);
  const resetInteractions = useCallback(() => {
    setInteractions({
      granularity: DEFAULT_GRANULARITY,
      range: deriveAutoRangeForGranularity(DEFAULT_GRANULARITY),
    });
  }, []);

  // ✅ aplicar preset (granularidad + rango auto) en una sola operación
  const applyUsersGranularityPreset = useCallback((g: Granularity) => {
    const range = deriveAutoRangeForGranularity(g);
    setUsers({ granularity: g, range });
  }, []);

  const applyInteractionsGranularityPreset = useCallback((g: Granularity) => {
    const range = deriveAutoRangeForGranularity(g);
    setInteractions({ granularity: g, range });
  }, []);

  const applyGranularityPreset = useCallback((slice: SliceName, g: Granularity) => {
    if (slice === "users") {
      const range = deriveAutoRangeForGranularity(g);
      setUsers({ granularity: g, range });
    } else {
      const range = deriveAutoRangeForGranularity(g);
      setInteractions({ granularity: g, range });
    }
  }, []);

  const value: Ctx = useMemo(
    () => ({
      users,
      interactions,
      setUsersGranularity,
      setUsersRange,
      resetUsers,
      setInteractionsGranularity,
      setInteractionsRange,
      resetInteractions,
      applyUsersGranularityPreset,
      applyInteractionsGranularityPreset,
      applyGranularityPreset,
    }),
    [
      users,
      interactions,
      setUsersGranularity,
      setUsersRange,
      resetUsers,
      setInteractionsGranularity,
      setInteractionsRange,
      resetInteractions,
      applyUsersGranularityPreset,
      applyInteractionsGranularityPreset,
      applyGranularityPreset,
    ]
  );

  return <HomeFiltersContext.Provider value={value}>{children}</HomeFiltersContext.Provider>;
}

export function useHomeFilters(): Ctx {
  const ctx = useContext(HomeFiltersContext);
  if (!ctx) throw new Error("useHomeFilters must be used within HomeFiltersProvider");
  return ctx;
}
