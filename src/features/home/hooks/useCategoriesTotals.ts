"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Granularity } from "@/lib/types";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { getCategoriesTotals } from "@/features/home/services/categoriesTotals";
import { CategoriesTotalsResponse, CategoryTotals } from "@/lib/api/analytics";

/* ---------- Tipos de entrada ---------- */
type Args = {
  granularity: Granularity;   // "d" | "w" | "m" | "y"
  endISO?: string;            // YYYY-MM-DD (opcional)
  auto?: boolean;             // carga automática al montar (default: true)
};

/* ---------- API público del hook ---------- */
export type CategoryTotalsItem = {
  name: string;
  currentTotal: number;
  previousTotal: number;
  deltaPct: number;
};

type LoadingState = { status: "loading" };
type ErrorState = { status: "error"; error: Error };
type ReadyState = { status: "ready"; data: CategoriesTotalsResponse };
type State = LoadingState | ErrorState | ReadyState;

type ReturnShape = {
  // Nuevo API “rico”
  data: CategoriesTotalsResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  items: CategoryTotalsItem[];
  itemsSorted: CategoryTotalsItem[];
  range: CategoriesTotalsResponse["range"] | undefined;
  property: string | undefined;

  // API legacy (compat con el componente existente)
  state: State;
  ids: CategoryId[];
  itemsById: Record<CategoryId, CategoryTotals>;
};

/* ---------- Overloads para aceptar string u objeto ---------- */
export function useCategoriesTotals(granularity: Granularity): ReturnShape;
export function useCategoriesTotals(args: Args): ReturnShape;

/* ---------- Implementación ---------- */
export function useCategoriesTotals(arg: Granularity | Args): ReturnShape {
  const granularity: Granularity = typeof arg === "string" ? arg : arg.granularity;
  const endISO: string | undefined = typeof arg === "string" ? undefined : arg.endISO;
  const auto: boolean = typeof arg === "string" ? true : arg.auto ?? true;

  const [data, setData] = useState<CategoriesTotalsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(auto));
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const key = useMemo(() => `${granularity}|${endISO ?? ""}`, [granularity, endISO]);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setIsLoading(true);
    setError(null);

    try {
      const resp = await getCategoriesTotals({ granularity, endISO, signal: ac.signal });
      if (!ac.signal.aborted) setData(resp);
    } catch (e) {
      if (!ac.signal.aborted) setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (!ac.signal.aborted) setIsLoading(false);
    }
  }, [granularity, endISO]);

  useEffect(() => {
    if (!auto) return;
    void load();
    return () => abortRef.current?.abort();
  }, [auto, key, load]);

  const items = useMemo<CategoryTotalsItem[]>(() => {
    if (!data) return [];
    return data.categories.map((name) => {
      const rec = data.perCategory[name];
      return {
        name,
        currentTotal: rec?.currentTotal ?? 0,
        previousTotal: rec?.previousTotal ?? 0,
        deltaPct: rec?.deltaPct ?? 0,
      };
    });
  }, [data]);

  const itemsSorted = useMemo(
    () => [...items].sort((a, b) => b.currentTotal - a.currentTotal),
    [items]
  );

  // ---- Compatibilidad con tu componente existente ----
  const state: State = isLoading
    ? { status: "loading" }
    : error
    ? { status: "error", error }
    : data
    ? { status: "ready", data }
    : { status: "loading" };

  const ids: CategoryId[] = data?.categories ?? [];
  const itemsById: Record<CategoryId, CategoryTotals> = data?.perCategory ?? ({} as Record<CategoryId, CategoryTotals>);

  return {
    // nuevo api
    data,
    isLoading,
    error,
    refetch: load,
    items,
    itemsSorted,
    range: data?.range,
    property: data?.property,
    // legacy api
    state,
    ids,
    itemsById,
  };
}

export default useCategoriesTotals;
