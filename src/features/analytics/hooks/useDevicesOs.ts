"use client";

import type { DevicesOsResponse } from "@/lib/api/analytics";
import type { DonutDatum, Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { getDevicesOs } from "../services/devicesOs";

type UseDevicesOsOk = {
  data: DevicesOsResponse;
  isLoading: false;
  error: null;
  refetch: () => void;
};
type UseDevicesOsLoading = {
  data: null;
  isLoading: true;
  error: null;
  refetch: () => void;
};
type UseDevicesOsError = {
  data: null;
  isLoading: false;
  error: Error;
  refetch: () => void;
};
export type UseDevicesOsResult =
  | UseDevicesOsOk
  | UseDevicesOsLoading
  | UseDevicesOsError;

export function useDevicesOs(input?: {
  start?: string;
  end?: string;
  granularity?: Granularity;
}): UseDevicesOsResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["devices-os", input?.start, input?.end, input?.granularity],
    queryFn: async (): Promise<DevicesOsResponse> => {
      return getDevicesOs({
        start: input?.start,
        end: input?.end,
        granularity: input?.granularity,
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error) => {
      if (error instanceof DOMException && error.name === "AbortError")
        return false;
      return failureCount < 2;
    },
  });

  if (data && !isLoading && !error)
    return { data, isLoading: false, error: null, refetch };
  if (isLoading) return { data: null, isLoading: true, error: null, refetch };
  return { data: null, isLoading: false, error: error as Error, refetch };
}

// Helper para colorear (sin mutar la respuesta)
export function colorizeOs(items: DonutDatum[]): DonutDatum[] {
  const OS_COLORS: Record<string, string> = {
    Windows: "#00A4EF",
    Android: "#3DDC84",
    iOS: "#A3AAAE",
    Macintosh: "#6E6E73",
    Linux: "#F4C20D",
    "Chrome OS": "#5BB974",
    Other: "#9CA3AF",
  };
  return items.map((d) => ({
    ...d,
    color: d.color ?? OS_COLORS[d.label] ?? "#9CA3AF",
  }));
}
