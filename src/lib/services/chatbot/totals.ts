/**
 * Servicio para obtener datos de chatbot para totales de categorías
 * Usa comportamiento KPI/Delta con shifts correctos
 */

import { computeRangesForKPI } from "@/lib/utils/time/dateRangeWindow";
import type { Granularity } from "@/lib/types";
import type { ApiResponse } from "@/lib/utils/chatbot/aggregate";

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
  const ranges = computeRangesForKPI({
    g: granularity,
    startISO: startDate || undefined,
    endISO: endDate || undefined,
  });

  // 2. Preparar payload para POST (necesitamos datos de ambos períodos: current + previous)
  const payload = {
    db: "project_huelva",
    patterns: "root.*.*.*", // Patrón más específico para capturar toda la taxonomía
    granularity: "d" as const, // Siempre "d" para la API interna
    startTime: formatDateForChatbot(ranges.previous.start), // Desde el inicio del período previous
    endTime: formatDateForChatbot(ranges.current.end),     // Hasta el final del período current
  };



  // 3. Hacer POST request (no GET)
  const response = await fetch(ENDPOINT_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  
  // 4. Enriquecer respuesta con información de rangos calculados
  const enrichedResponse: ChatbotTotalsResponse = {
    ...data,
    meta: {
      granularity,
      timezone: "UTC",
      range: {
        current: ranges.current,
        previous: ranges.previous,
      },
    },
  };

  return enrichedResponse;
}