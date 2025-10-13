"use client";

import {
  fetchChatbotTags,
  type ChatbotGranularity,
  type ChatbotPoint,
} from "@/lib/api/chatbot";
import { CATEGORY_ID_ORDER, type CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import { parseISO } from "@/lib/utils/time/datetime";
import {
  deriveRangeEndingYesterday,
  getDonutWindow,
  shiftRangeByDays,
} from "@/lib/utils/core/windowPolicyAnalytics";

/* ---------- tipos públicos (compatibles con la UI) ---------- */
export type CategoryTotalsItem = {
  id: CategoryId;
  title: string; // usamos el id como title
  total: number; // suma del bucket "current" (según windowPolicy)
  deltaPct: number | null; // (current - previous) / previous * 100; null si previous=0
};

export type CategoriesTotalsResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string; // aquí "chatbot" (para reusar UI)
  items: CategoryTotalsItem[];
};

/* ---------- utils ---------- */
const toYYYYMMDD = (iso: string) => iso.replaceAll("-", "");

function sumOutput(output: Record<string, ChatbotPoint[]>): number {
  let acc = 0;
  for (const arr of Object.values(output)) {
    for (const p of arr) acc += p.value || 0;
  }
  return acc;
}

/**
 * Totales por categoría + delta:
 * - g="d": current = AYER exacto; previous = ANTEAYER exacto.
 * - g="w"|"m"|"y": current/previous según windowPolicy (misma política que Analytics).
 * Para evitar sorpresas con agregaciones, siempre consultamos en granularidad 'd' y sumamos por rango.
 */
export async function getCategoriesTotals(
  granularity: Granularity,
  time?: { startISO: string; endISO: string } | { endISO?: string } | string,
  signal?: AbortSignal
): Promise<CategoriesTotalsResponse> {
  // construir ventanas con la misma política usada en analytics
  const startISO =
    typeof time === "object" && time && "startISO" in time
      ? time.startISO
      : undefined;
  const endISO =
    typeof time === "string"
      ? time
      : typeof time === "object" && time
      ? time.endISO
      : undefined;

  // Unificar lógica de rangos y donut
  const now = endISO ? parseISO(endISO) : undefined;
  const currPreset = deriveRangeEndingYesterday(granularity, now);
  const current = { start: currPreset.startTime, end: currPreset.endTime };
  const previous = shiftRangeByDays(current, -1);
  const donutWindow = getDonutWindow(granularity, current);

  const curStart = toYYYYMMDD(donutWindow.start);
  const curEnd = toYYYYMMDD(donutWindow.end);
  const prvStart = toYYYYMMDD(previous.start);
  const prvEnd = toYYYYMMDD(previous.end);

  const items = await Promise.all(
    CATEGORY_ID_ORDER.map(async (cat) => {
      const [curResp, prvResp] = await Promise.all([
        fetchChatbotTags(
          {
            pattern: `root.*.${cat}.*`,
            granularity: "d" as ChatbotGranularity,
            startTime: curStart,
            endTime: curEnd,
          },
          { signal }
        ),
        fetchChatbotTags(
          {
            pattern: `root.*.${cat}.*`,
            granularity: "d" as ChatbotGranularity,
            startTime: prvStart,
            endTime: prvEnd,
          },
          { signal }
        ),
      ]);

      const total = sumOutput(curResp.output);
      const prev = sumOutput(prvResp.output);
      const deltaPct = prev > 0 ? ((total - prev) / prev) * 100 : null;

      return {
        id: cat,
        title: cat,
        total,
        deltaPct,
      } as CategoryTotalsItem;
    })
  );

  return {
    granularity,
    range: { current, previous },
    property: "chatbot",
    items,
  };
}
