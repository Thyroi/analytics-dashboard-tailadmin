"use client";

import {
  getTownsTotalsChatbot,
  type TownsTotalsResponse,
  type TownTotalsItem,
} from "@/features/chatbot/services/townsTotalsChatbot";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export type TimeParams =
  | { startISO: string; endISO: string }
  | { endISO?: string }
  | string
  | undefined;

type ReadyState = {
  status: "ready";
  data: TownsTotalsResponse;
  ids: TownId[];
  itemsById: Record<
    TownId,
    { title: string; total: number; deltaPct: number | null }
  >;
};

export function useTownsTotalsChatbot(
  granularity: Granularity,
  time?: TimeParams
) {
  const endISO =
    typeof time === "string"
      ? time
      : typeof time === "object" && time
      ? time.endISO
      : undefined;
  const startISO =
    typeof time === "object" && time && "startISO" in time
      ? time.startISO
      : undefined;

  const q = useQuery({
    queryKey: [
      "chatbot:townsTotals",
      granularity,
      startISO ?? null,
      endISO ?? null,
    ],
    queryFn: () => getTownsTotalsChatbot(granularity, { startISO, endISO }),
  });

  const data = q.data;
  const ready: ReadyState | null = data
    ? {
        status: "ready",
        data,
        ids: data.items.map((it: TownTotalsItem) => it.id),
        itemsById: data.items.reduce<ReadyState["itemsById"]>((acc, it) => {
          acc[it.id] = {
            title: it.title,
            total: Number.isFinite(it.total) ? it.total : 0,
            deltaPct:
              typeof it.deltaPct === "number" && Number.isFinite(it.deltaPct)
                ? it.deltaPct
                : null,
          };
          return acc;
        }, {} as ReadyState["itemsById"]),
      }
    : null;

  return {
    state: ready ?? ({ status: "loading" } as const),
    ids: ready?.ids ?? [],
    itemsById: (ready?.itemsById ?? {}) as ReadyState["itemsById"],
    isInitialLoading: q.isLoading && !q.isFetched,
    isFetching: q.isFetching,
    error: q.error as Error | null,
    refetch: q.refetch,
  };
}
