"use client";

import {
  fetchChatbotTownTotals,
  type TownTotalsResponse,
} from "@/lib/services/chatbot/townTotals";
import { TOWN_ID_ORDER, getTownLabel } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { computeDeltaArtifact, type DeltaArtifact } from "@/lib/utils/delta";
import { computeDeltaPct } from "@/lib/utils/time/timeWindows";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export interface UseResumenTownParams {
  granularity: Granularity;
  startDate?: string | null;
  endDate?: string | null;
}

export interface TownGridData {
  id: string;
  title: string;
  ga4Total: number;
  ga4Previous: number; // ✨ NUEVO: GA4 valor anterior
  chatbotTotal: number;
  chatbotPrevious: number; // ✨ NUEVO: Chatbot valor anterior
  combinedTotal: number;
  combinedDelta: number;
  combinedDeltaPct: number | null;
  deltaArtifact: DeltaArtifact; // ✨ Artifact completo con estado
}

// Tipo para la respuesta de la API /api/analytics/v1/dimensions/pueblos/totales
interface TownTotalesResponse {
  success: boolean;
  calculation: {
    requestedGranularity: Granularity;
    finalGranularity: Granularity;
    granularityReason: string;
    currentPeriod: { start: string; end: string };
    previousPeriod: { start: string; end: string };
  };
  data: {
    property: string;
    items: Array<{
      id: string;
      title: string;
      total: number;
      previousTotal: number;
      deltaPct: number | null;
    }>;
  };
}

/**
 * Hook para datos combinados de GA4 + Chatbot específico para Towns
 * Usa un solo llamado a chatbot con patrón root.*.*.* y función de agregación
 */
export function useResumenTown({
  granularity,
  startDate,
  endDate,
}: UseResumenTownParams) {
  // Query para datos GA4 de towns
  const townTotalesQuery = useQuery({
    queryKey: ["townTotales", granularity, startDate, endDate],
    queryFn: async (): Promise<TownTotalesResponse> => {
      // El nuevo API requiere startDate y endDate obligatorios
      if (!startDate || !endDate) {
        throw new Error(
          "startDate and endDate are required for townTotales API",
        );
      }

      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const apiUrl = `/api/analytics/v1/dimensions/pueblos/totales?${params}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    enabled: Boolean(startDate && endDate),
  });

  // Query para totales del chatbot (Mindsaic v2)
  const chatbotQuery = useQuery<TownTotalsResponse>({
    queryKey: ["chatbot", "town-totals", granularity, startDate, endDate],
    queryFn: () => fetchChatbotTownTotals({ granularity, startDate, endDate }),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  // Procesar y combinar datos de GA4 y Chatbot usando función de agregación
  const processedData: TownGridData[] = useMemo(() => {
    return TOWN_ID_ORDER.map((townId) => {
      // Datos GA4
      const ga4Item = townTotalesQuery.data?.data.items.find(
        (item) => item.id === townId,
      );
      const ga4Current = ga4Item?.total ?? 0;
      const ga4Previous = ga4Item?.previousTotal ?? 0;

      // Datos Chatbot desde la función de agregación
      const chatbotTown = chatbotQuery.data?.towns.find(
        (town) => town.id === townId,
      );
      const chatbotCurrent = chatbotTown?.currentTotal ?? 0;
      const chatbotPrevious = chatbotTown?.prevTotal ?? 0;

      // Combinados con función estandarizada para delta %
      const combinedCurrent = ga4Current + chatbotCurrent;
      const combinedPrevious = ga4Previous + chatbotPrevious;
      const combinedDelta = combinedCurrent - combinedPrevious;
      const combinedDeltaPct = computeDeltaPct(
        combinedCurrent,
        combinedPrevious,
      );
      const deltaArtifact = computeDeltaArtifact(
        combinedCurrent,
        combinedPrevious,
      );

      return {
        id: townId,
        title: getTownLabel(townId),
        ga4Total: ga4Current,
        ga4Previous: ga4Previous,
        chatbotTotal: chatbotCurrent,
        chatbotPrevious: chatbotPrevious,
        combinedTotal: combinedCurrent,
        combinedDelta: combinedDelta,
        combinedDeltaPct: combinedDeltaPct,
        deltaArtifact: deltaArtifact,
      };
    });
  }, [townTotalesQuery.data, chatbotQuery.data]);

  return {
    data: processedData,
    isLoading: townTotalesQuery.isLoading || chatbotQuery.isLoading,
    isError: townTotalesQuery.isError || !!chatbotQuery.error,
    error: townTotalesQuery.error || chatbotQuery.error,
    refetch: () => {
      townTotalesQuery.refetch();
      chatbotQuery.refetch();
    },
  };
}
