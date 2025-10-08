import { getTopCategories } from "@/features/chatbot/services/topCategories";
import { useQuery } from "@tanstack/react-query";

export function useTopCategories(params: {
  patterns: string[];
  granularity: string;
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
