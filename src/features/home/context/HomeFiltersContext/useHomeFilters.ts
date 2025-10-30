"use client";

import { useContext } from "react";
import { HomeFiltersContext } from "./context";
import type { HomeFiltersContextValue } from "./types";

export function useHomeFilters(): HomeFiltersContextValue {
  const ctx = useContext(HomeFiltersContext);
  if (!ctx) {
    throw new Error("useHomeFilters must be used within HomeFiltersProvider");
  }
  return ctx;
}
