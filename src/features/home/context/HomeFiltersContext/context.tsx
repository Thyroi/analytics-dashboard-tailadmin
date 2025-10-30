"use client";

import { createContext } from "react";
import type { HomeFiltersContextValue } from "./types";

export const HomeFiltersContext = createContext<HomeFiltersContextValue | null>(
  null
);
