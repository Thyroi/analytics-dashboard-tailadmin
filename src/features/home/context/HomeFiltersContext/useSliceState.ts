import type { Granularity } from "@/lib/types";
import { useCallback, useState } from "react";
import type { SliceState } from "./types";
import { getRangeForGranularity } from "./utils";

export function useSliceState(
  initialGranularity: Granularity,
  initialRange: { startTime: string; endTime: string }
) {
  const [state, setState] = useState<SliceState>({
    granularity: initialGranularity,
    range: initialRange,
  });

  const setGranularity = useCallback((g: Granularity) => {
    setState((s) => ({ ...s, granularity: g }));
  }, []);

  const setRange = useCallback((r: { startTime: string; endTime: string }) => {
    setState((s) => ({ ...s, range: r }));
  }, []);

  const reset = useCallback(() => {
    const range = getRangeForGranularity(initialGranularity);
    setState({ granularity: initialGranularity, range });
  }, [initialGranularity]);

  const applyGranularityPreset = useCallback((g: Granularity) => {
    const range = getRangeForGranularity(g);
    setState({ granularity: g, range });
  }, []);

  return {
    state,
    setGranularity,
    setRange,
    reset,
    applyGranularityPreset,
  };
}
