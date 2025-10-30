import type { Granularity } from "@/lib/types";

export type Range = { startTime: string; endTime: string };

export interface SliceState {
  granularity: Granularity;
  range: Range;
}

export interface HomeFiltersContextValue {
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
  applyGranularityPreset: (
    slice: "users" | "interactions",
    g: Granularity
  ) => void;
}

export interface HomeFiltersProviderProps {
  children: React.ReactNode;
  initialGranularity?: Granularity;
  initialDateFrom?: string;
  initialDateTo?: string;
}
