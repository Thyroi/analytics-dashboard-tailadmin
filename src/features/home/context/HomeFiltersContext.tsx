"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import type { Granularity, SliceName } from "@/lib/types";
import {
  deriveAutoRangeForGranularity,
  rangeToPreset, // 👈 convertidor {start,end} -> {startTime,endTime}
} from "@/lib/utils/datetime";

type Range = { startTime: string; endTime: string };

type SliceState = {
  granularity: Granularity;
  range: Range;
};

type Ctx = {
  users: SliceState;
  interactions: SliceState;

  setUsersGranularity: (g: Granularity) => void;
  setUsersRange: (r: Range) => void;
  resetUsers: () => void;

  setInteractionsGranularity: (g: Granularity) => void;
  setInteractionsRange: (r: Range) => void;
  resetInteractions: () => void;

  applyUsersGranularityPreset: (g: Granularity) => void;
  applyInteractionsGranularityPreset: (g: Granularity) => void;
  applyGranularityPreset: (slice: SliceName, g: Granularity) => void;
};

const HomeFiltersContext = createContext<Ctx | null>(null);

type ProviderProps = {
  children: React.ReactNode;
  initialGranularity?: Granularity;
  initialDateFrom?: string;
  initialDateTo?: string;
};

export function HomeFiltersProvider({
  children,
  initialGranularity = "m",
  initialDateFrom,
  initialDateTo,
}: ProviderProps) {
  // rango inicial (si pasan fechas, respétalas; si no, usa preset por granularidad)
  const initialRange: Range =
    initialDateFrom && initialDateTo
      ? { startTime: initialDateFrom, endTime: initialDateTo }
      : rangeToPreset(deriveAutoRangeForGranularity(initialGranularity)); // ✅ convertir

  const [users, setUsers] = useState<SliceState>({
    granularity: initialGranularity,
    range: initialRange,
  });

  const [interactions, setInteractions] = useState<SliceState>({
    granularity: initialGranularity,
    range: initialRange,
  });

  // setters simples
  const setUsersGranularity = useCallback((g: Granularity) => {
    setUsers((s) => ({ ...s, granularity: g }));
  }, []);

  const setUsersRange = useCallback((r: Range) => {
    setUsers((s) => ({ ...s, range: r }));
  }, []);

  const resetUsers = useCallback(() => {
    const range = rangeToPreset(deriveAutoRangeForGranularity(initialGranularity)); // ✅
    setUsers({ granularity: initialGranularity, range });
  }, [initialGranularity]);

  const setInteractionsGranularity = useCallback((g: Granularity) => {
    setInteractions((s) => ({ ...s, granularity: g }));
  }, []);

  const setInteractionsRange = useCallback((r: Range) => {
    setInteractions((s) => ({ ...s, range: r }));
  }, []);

  const resetInteractions = useCallback(() => {
    const range = rangeToPreset(deriveAutoRangeForGranularity(initialGranularity)); // ✅
    setInteractions({ granularity: initialGranularity, range });
  }, [initialGranularity]);

  // aplicar preset (granularidad + rango auto)
  const applyUsersGranularityPreset = useCallback((g: Granularity) => {
    const range = rangeToPreset(deriveAutoRangeForGranularity(g)); // ✅
    setUsers({ granularity: g, range });
  }, []);

  const applyInteractionsGranularityPreset = useCallback((g: Granularity) => {
    const range = rangeToPreset(deriveAutoRangeForGranularity(g)); // ✅
    setInteractions({ granularity: g, range });
  }, []);

  const applyGranularityPreset = useCallback((slice: SliceName, g: Granularity) => {
    const range = rangeToPreset(deriveAutoRangeForGranularity(g)); // ✅
    if (slice === "users") {
      setUsers({ granularity: g, range });
    } else {
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

  return (
    <HomeFiltersContext.Provider value={value}>
      {children}
    </HomeFiltersContext.Provider>
  );
}

export function useHomeFilters(): Ctx {
  const ctx = useContext(HomeFiltersContext);
  if (!ctx) throw new Error("useHomeFilters must be used within HomeFiltersProvider");
  return ctx;
}
