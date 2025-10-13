// Re-export from unified context to maintain backward compatibility
export {
  HeaderAnalyticsTimeContext,
  HeaderAnalyticsTimeProvider,
  useHeaderAnalyticsTimeframe,
} from "./UnifiedTimeContext";

// Re-export the type with alias for backward compatibility
export type { TimeframeContextValue as HeaderAnalyticsTimeValue } from "./UnifiedTimeContext";
