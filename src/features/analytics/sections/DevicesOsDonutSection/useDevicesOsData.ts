import { useMemo } from "react";
import {
  colorizeOs,
  useDevicesOs,
} from "@/features/analytics/hooks/useDevicesOs";
import type { Granularity } from "@/lib/types";
import type { DonutItem } from "./types";

interface UseDevicesOsDataParams {
  start?: string;
  end?: string;
  granularity: Granularity;
}

export function useDevicesOsData({ start, end, granularity }: UseDevicesOsDataParams) {
  const { data, isLoading, error } = useDevicesOs({ start, end, granularity });

  const items: DonutItem[] = useMemo(
    () => colorizeOs(data?.items ?? []),
    [data?.items]
  );

  return { items, isLoading, error };
}
