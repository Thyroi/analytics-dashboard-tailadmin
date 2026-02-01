import {
  fetchLevel1Drilldown,
  type FetchLevel1Response,
} from "@/lib/services/chatbot/level1";
import type { WindowGranularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export type UseLevel1DrilldownParams = {
  scopeType: "category" | "town";
  scopeId: string;
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  db?: string;
  sumStrategy?: "sum" | "last";
  debug?: boolean;
};

export type UseLevel1DrilldownResult = {
  data: FetchLevel1Response | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

function toYMD(iso?: string | null): string | undefined {
  return iso ? iso.replace(/-/g, "") : undefined;
}

function buildKey(p: UseLevel1DrilldownParams): unknown[] {
  return [
    "chatbot",
    "level1",
    p.scopeType,
    p.scopeId,
    {
      g: p.granularity,
      start: p.startDate ?? null,
      end: p.endDate ?? null,
      db: p.db ?? "huelva",
      sum: p.sumStrategy ?? "sum",
    },
  ];
}

export function useLevel1Drilldown(
  params: UseLevel1DrilldownParams,
): UseLevel1DrilldownResult {
  const query = useQuery({
    queryKey: buildKey(params),
    queryFn: async () => {
      return fetchLevel1Drilldown({
        scopeType: params.scopeType,
        scopeId: params.scopeId,
        granularity: params.granularity,
        startTime: toYMD(params.startDate),
        endTime: toYMD(params.endDate),
        db: params.db,
        sumStrategy: params.sumStrategy,
        debug: params.debug,
      });
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    enabled: Boolean(params.scopeType && params.scopeId),
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}
