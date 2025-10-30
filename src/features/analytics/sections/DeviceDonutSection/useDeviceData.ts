import {
  colorizeDevices,
  useDevices,
} from "@/features/analytics/hooks/useDevices";
import type { Granularity } from "@/lib/types";
import { useMemo } from "react";
import type { DonutItem } from "./types";

interface UseDeviceDataParams {
  start?: string;
  end?: string;
  granularity: Granularity;
}

export function useDeviceData({
  start,
  end,
  granularity,
}: UseDeviceDataParams) {
  const { data, isLoading, error } = useDevices({ start, end, granularity });

  const items: DonutItem[] = useMemo(
    () => colorizeDevices(data?.items ?? []),
    [data?.items]
  );

  return { items, isLoading, error };
}
