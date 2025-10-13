"use client";

import {
  fetchGender,
  type GenderPayload,
} from "@/features/analytics/services/gender";
import type { DonutDatum, Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

/** Paleta recomendada por label (es/ES) */
const GENDER_COLORS: Record<string, string> = {
  Hombre: "#3B82F6", // blue-500
  Mujer: "#F472B6", // pink-400
  Desconocido: "#9CA3AF", // gray-400
  Otro: "#A855F7", // purple-600 (fallback)
};

export function colorizeGender(items: DonutDatum[]): DonutDatum[] {
  return items.map((d) => {
    const color = d.color ?? GENDER_COLORS[d.label] ?? GENDER_COLORS["Otro"];
    return { ...d, color };
  });
}

type Args = { start?: string; end?: string; granularity?: Granularity };
type UseGenderResult =
  | { data: GenderPayload; isLoading: false; error: null; refetch: () => void }
  | { data: null; isLoading: true; error: null; refetch: () => void }
  | { data: null; isLoading: false; error: Error; refetch: () => void };

export function useGender({
  start,
  end,
  granularity = "d",
}: Args): UseGenderResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["gender", start, end, granularity],
    queryFn: async (): Promise<GenderPayload> => {
      return fetchGender({ start, end, granularity });
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
