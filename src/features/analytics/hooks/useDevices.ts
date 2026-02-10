"use client";

import { fetchJSON } from "@/lib/api/analytics";
import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

type DonutItem = { label: string; value: number };

type DevicesResponse = {
  items: DonutItem[];
};

type Args = {
  start?: string;
  end?: string;
  granularity?: Granularity;
};

type UseDevicesResult =
  | { data: DevicesResponse; isLoading: false; error: null }
  | { data: null; isLoading: true; error: null }
  | { data: null; isLoading: false; error: Error };

export function useDevices({
  start,
  end,
  granularity = "d",
}: Args): UseDevicesResult {
  const params = new URLSearchParams({ granularity });
  if (start) params.set("start", start);
  if (end) params.set("end", end);

  const { data, isLoading, error } = useQuery<DevicesResponse, Error>({
    queryKey: ["analytics", "devices", granularity, start, end],
    queryFn: () =>
      fetchJSON<DevicesResponse>(`/api/analytics/v1/devices?${params}`),
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000, // 10 min
  });

  if (isLoading) return { data: null, isLoading: true, error: null };
  if (error) return { data: null, isLoading: false, error };
  return { data: data!, isLoading: false, error: null };
}

/**
 * Coloriza los dispositivos con colores específicos.
 */
export function colorizeDevices(
  items: DonutItem[],
): Array<DonutItem & { color: string }> {
  const colorMap: Record<string, string> = {
    desktop: "#3b82f6", // blue-500
    mobile: "#10b981", // green-500
    tablet: "#f59e0b", // amber-500
  };

  return items.map((item) => ({
    ...item,
    color: colorMap[item.label.toLowerCase()] || "#6b7280", // gray-500 por defecto
  }));
}
