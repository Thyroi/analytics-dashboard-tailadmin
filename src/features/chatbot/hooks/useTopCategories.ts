
import { getTopCategories } from "@/features/chatbot/services/topCategories";
import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export function useTopCategories(params: {
  patterns: string[];
  granularity: Granularity;
  startTime?: string;
  endTime?: string;
  db?: string;
}) {
  return useQuery({
    queryKey: ["top-categories", params],
    queryFn: () => getTopCategories(params),
    staleTime: 60_000,
  });
}
