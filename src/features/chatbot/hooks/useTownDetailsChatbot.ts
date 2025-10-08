"use client";

import { getTownDetailsChatbot } from "@/features/chatbot/services/townDetailsChatbot";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export function useTownDetailsChatbot(
  townId: TownId,
  granularity: Granularity,
  endISO?: string
) {
  return useQuery({
    queryKey: ["chatbot:townDetails", townId, granularity, endISO ?? null],
    queryFn: () => getTownDetailsChatbot(townId, granularity, endISO),
  });
}
