"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DonutDatum, Granularity } from "@/lib/types";
import { fetchGender, type GenderPayload } from "@/features/analytics/services/gender";

/** Paleta recomendada por label (es/ES) */
const GENDER_COLORS: Record<string, string> = {
  Hombre: "#3B82F6",       // blue-500
  Mujer: "#F472B6",        // pink-400
  Desconocido: "#9CA3AF",  // gray-400
  Otro: "#A855F7",         // purple-600 (fallback)
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
  | { data: null;         isLoading: true;  error: null; refetch: () => void }
  | { data: null;         isLoading: false; error: Error; refetch: () => void };

export function useGender({ start, end, granularity = "d" }: Args): UseGenderResult {
  const [data, setData] = useState<GenderPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const key = useMemo(() => `${start ?? ""}|${end ?? ""}|${granularity}`, [start, end, granularity]);

  const run = useCallback(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setIsLoading(true);
    setError(null);

    fetchGender({ start, end, granularity, signal: ac.signal })
      .then((payload) => {
        if (!ac.signal.aborted) setData(payload);
      })
      .catch((e) => {
        if (!ac.signal.aborted) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!ac.signal.aborted) setIsLoading(false);
      });
  }, [start, end, granularity]);

  useEffect(() => {
    run();
    return () => abortRef.current?.abort();
  }, [key, run]);

  if (data && !isLoading && !error) return { data, isLoading: false, error: null, refetch: run };
  if (isLoading) return { data: null, isLoading: true, error: null, refetch: run };
  return { data: null, isLoading: false, error: error as Error, refetch: run };
}
