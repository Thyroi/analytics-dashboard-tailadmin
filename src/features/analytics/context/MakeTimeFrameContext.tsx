// Re-export from unified context to maintain backward compatibility
export {
  TimeframeProvider as MakeTimeframeProvider,
  useTimeframe as useMakeTimeframe,
  TimeframeContext as MakeTimeframeContext,
} from "./UnifiedTimeContext";

// Re-export the type with alias for backward compatibility
export type { TimeframeContextValue as MakeTimeframeContextValue } from "./UnifiedTimeContext";