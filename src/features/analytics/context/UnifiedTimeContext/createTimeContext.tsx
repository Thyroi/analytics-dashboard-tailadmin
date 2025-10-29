"use client";

import { createContext, useContext } from "react";
import { TimeframeProvider } from "./TimeframeProvider";
import type {
  TimeframeContextValue,
  TimeframeProviderProps,
} from "./types";

/**
 * Factory function to create timeframe context instances
 *
 * Creates a new context with Provider and hook for managing timeframe state
 */
export function createTimeContext(contextName: string) {
  const Context = createContext<TimeframeContextValue | null>(null);
  Context.displayName = `${contextName}TimeContext`;

  const Provider = ({
    children,
    defaultGranularity = "d",
  }: TimeframeProviderProps) => {
    return (
      <TimeframeProvider
        Context={Context}
        defaultGranularity={defaultGranularity}
      >
        {children}
      </TimeframeProvider>
    );
  };

  const useTimeframe = () => {
    const context = useContext(Context);
    if (!context) {
      throw new Error(
        `use${contextName}Timeframe must be used within ${contextName}TimeProvider`
      );
    }
    return context;
  };

  return {
    Provider,
    useTimeframe,
    Context,
  };
}
