/**
 * Hook principal para la vista Chatbot según especificaciones del prompt maestro
 */

import { useEffect, useMemo, useState } from "react";
import { fetchTagAudit, PATTERNS, TagAuditError } from "../services/tagAudit";
import type {
  ChatbotCardData,
  ComparisonMode,
  DrilldownData,
  Granularity,
  PeriodConfig,
  UIState,
  ViewMode,
} from "../types";
import {
  generateDrilldownData,
  processCategories,
  processTowns,
} from "../utils/aggregation";
import { computePeriods } from "../utils/periods";

export type UseChatbotByTagParams = {
  mode: ViewMode;
  granularity: Granularity;
  categories?: string[];
  towns?: string[];
  comparisonMode?: ComparisonMode;
};

export type UseChatbotByTagResult = {
  cards: ChatbotCardData[];
  state: UIState;
  error: string | null;
  period: PeriodConfig;
  refresh: () => void;
};

/**
 * Hook principal para gestionar datos de tarjetas
 */
export function useChatbotByTag({
  mode,
  granularity,
  categories = [],
  towns = [],
  comparisonMode = "toDate",
}: UseChatbotByTagParams): UseChatbotByTagResult {
  const [cards, setCards] = useState<ChatbotCardData[]>([]);
  const [state, setState] = useState<UIState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Calcular períodos según especificaciones
  const period = useMemo(() => {
    try {
      return computePeriods(granularity, comparisonMode);
    } catch (err) {
      console.error("Error calculando períodos:", err);
      setState("error");
      setError(
        err instanceof Error ? err.message : "Error calculando períodos"
      );
      return {
        granularity,
        currentStart: "",
        currentEnd: "",
        previousStart: "",
        previousEnd: "",
        apiGranularity: granularity,
        apiStartTime: "",
        apiEndTime: "",
      } as PeriodConfig;
    }
  }, [granularity, comparisonMode]);

  // Determinar pattern según modo
  const pattern = useMemo(() => {
    if (mode === "byCategory") {
      // Para categorías, usamos pattern que capture todas las categorías
      return PATTERNS.allCategories();
    } else {
      // Para pueblos, usamos pattern que capture todos los pueblos
      return PATTERNS.allTowns();
    }
  }, [mode]);

  // Efecto para cargar datos
  useEffect(() => {
    if (!period.apiStartTime || !period.apiEndTime) {
      return;
    }

    let isCancelled = false;

    const loadData = async () => {
      try {
        setState("loading");
        setError(null);

        const response = await fetchTagAudit({
          patterns: pattern,
          granularity: period.apiGranularity,
          startTime: period.apiStartTime,
          endTime: period.apiEndTime,
        });

        if (isCancelled) return;

        // Verificar si hay datos
        const hasData = Object.keys(response.output || {}).length > 0;
        if (!hasData) {
          setState("empty");
          setCards([]);
          return;
        }

        // Procesar datos según modo
        let processedCards: ChatbotCardData[];

        if (mode === "byCategory") {
          if (categories.length === 0) {
            setState("empty");
            setCards([]);
            return;
          }

          processedCards = processCategories(
            response,
            categories,
            period.currentStart,
            period.currentEnd,
            period.previousStart,
            period.previousEnd
          );
        } else {
          if (towns.length === 0) {
            setState("empty");
            setCards([]);
            return;
          }

          processedCards = processTowns(
            response,
            towns,
            period.currentStart,
            period.currentEnd,
            period.previousStart,
            period.previousEnd
          );
        }

        setCards(processedCards);
        setState(processedCards.length > 0 ? "success" : "empty");
      } catch (err) {
        if (isCancelled) return;

        console.error("❌ Error cargando datos chatbot:", err);

        let errorMessage = "Error desconocido";

        if (err instanceof TagAuditError) {
          errorMessage = err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setState("error");
        setCards([]);
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [
    mode,
    granularity,
    pattern,
    period.apiGranularity,
    period.apiStartTime,
    period.apiEndTime,
    period.currentStart,
    period.currentEnd,
    period.previousStart,
    period.previousEnd,
    categories,
    towns,
    refreshTrigger,
  ]);

  const refresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return {
    cards,
    state,
    error,
    period,
    refresh,
  };
}

/**
 * Hook para datos de drill-down de una tarjeta específica
 */
export function useChatbotDrilldown({
  cardId,
  cardLabel,
  mode,
  granularity,
  period,
}: {
  cardId: string;
  cardLabel: string;
  mode: ViewMode;
  granularity: Granularity;
  period: PeriodConfig;
}) {
  const [data, setData] = useState<DrilldownData | null>(null);
  const [state, setState] = useState<UIState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cardId || !period.apiStartTime) {
      setState("idle");
      return;
    }

    let isCancelled = false;

    const loadDrilldownData = async () => {
      try {
        setState("loading");
        setError(null);

        // Determinar pattern para drill-down
        const pattern =
          mode === "byCategory"
            ? PATTERNS.categoryTotal(cardId)
            : PATTERNS.townTotal(cardId);

        const response = await fetchTagAudit({
          patterns: pattern,
          granularity: period.apiGranularity,
          startTime: period.apiStartTime,
          endTime: period.apiEndTime,
        });

        if (isCancelled) return;

        // Verificar si hay datos
        const hasData = Object.keys(response.output || {}).length > 0;
        if (!hasData) {
          setState("empty");
          setData(null);
          return;
        }

        // Procesar datos para drill-down
        const drilldownData = generateDrilldownData(
          response,
          cardId,
          cardLabel,
          mode,
          period.currentStart,
          period.currentEnd,
          period.previousStart,
          period.previousEnd
        );

        setData(drilldownData);
        setState("success");
      } catch (err) {
        if (isCancelled) return;

        console.error("❌ Error en drill-down:", err);
        setError(err instanceof Error ? err.message : "Error en drill-down");
        setState("error");
        setData(null);
      }
    };

    loadDrilldownData();

    return () => {
      isCancelled = true;
    };
  }, [cardId, cardLabel, mode, granularity, period]);

  return {
    data,
    state,
    error,
  };
}
