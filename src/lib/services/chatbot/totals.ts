/**
 * Servicio para obtener datos de chatbot para totales de categorías
 * Usa comportamiento KPI/Delta con shifts correctos
 */

import { ChallengeError, safeJsonFetch } from "@/lib/fetch/safeFetch";
import type { Granularity } from "@/lib/types";
import type { ApiResponse } from "@/lib/utils/chatbot/aggregate";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";

/** Parámetros para el servicio de chatbot */
export type ChatbotTotalsParams = {
  granularity?: Granularity;
  startDate?: string | null;
  endDate?: string | null;
};

/** Respuesta extendida del chatbot con información de rangos */
export type ChatbotTotalsResponse = ApiResponse & {
  meta: {
    granularity: Granularity;
    timezone: string;
    range: {
      current: { start: string; end: string };
      previous: { start: string; end: string };
    };
  };
};

/** URL del endpoint */
const ENDPOINT_URL = "/api/chatbot/audit/tags";

/**
 * Convierte formato YYYY-MM-DD a YYYYMMDD requerido por API de chatbot
 */
function formatDateForChatbot(dateISO: string): string {
  return dateISO.replace(/-/g, "");
}

/**
 * Obtiene datos raw del chatbot usando comportamiento KPI y rangos correctos
 */
export async function fetchChatbotTotals(
  params: ChatbotTotalsParams = {}
): Promise<ChatbotTotalsResponse> {
  const { granularity = "d", startDate, endDate } = params;

  // 1. Calcular rangos usando comportamiento KPI (igual que Analytics)
  const ranges = computeRangesForKPI(
    granularity,
    startDate || null,
    endDate || null
  );

  // 2. Preparar payload para POST (necesitamos datos de ambos períodos: current + previous)
  const payload = {
    db: "project_huelva",
    patterns: "root.*.*.*", // Patrón más específico para capturar toda la taxonomía
    granularity: "d" as const, // Siempre "d" para la API interna
    startTime: formatDateForChatbot(ranges.previous.start), // Desde el inicio del período previous
    endTime: formatDateForChatbot(ranges.current.end), // Hasta el final del período current
  };

  // 3. Hacer POST request (no GET) usando safeJsonFetch
  let data: ApiResponse;
  try {
    // safeJsonFetch devuelve el JSON parseado o lanza ChallengeError
    data = (await safeJsonFetch(ENDPOINT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })) as ApiResponse;
  } catch (err) {
    if (err instanceof ChallengeError) {
      // Upstream returned a Cloudflare challenge (HTML). Devolver respuesta vacía
      // para que la UI muestre 0s en lugar de fallar.
      console.warn(
        "fetchChatbotTotals: upstream challenge detected, returning empty response",
        {
          url: ENDPOINT_URL,
        }
      );

      // Construir fallback response mínimo
      const fallback = {
        code: 200,
        output: {},
        meta: {
          granularity: granularity as Granularity,
          timezone: "UTC",
          range: {
            current: ranges.current,
            previous: ranges.previous,
          },
        },
      };

      return fallback as unknown as ChatbotTotalsResponse;
    }

    throw err;
  }

  // 4. Enriquecer respuesta con información de rangos calculados
  const enrichedResponse = {
    ...data,
    meta: {
      granularity,
      timezone: "UTC",
      range: {
        current: ranges.current,
        previous: ranges.previous,
      },
    },
  } as unknown as ChatbotTotalsResponse;

  return enrichedResponse;
}
