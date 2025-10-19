import { fetchChatbotTags, type ChatbotGranularity } from "@/lib/api/chatbot";
import { TOWN_ID_ORDER, type TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import {
  deriveRangeEndingYesterday,
  getDonutWindow,
  shiftRangeByDays,
} from "@/lib/utils/core/windowPolicyAnalytics";
import { parseISO } from "@/lib/utils/time/datetime";
import { buildAxisFromChatbot } from "@/lib/utils/time/timeAxisChatbot";

export type TownTotalsItem = {
  id: TownId;
  title: string;
  total: number;
  previousTotal?: number; // ✨ NUEVO: incluir valor anterior
  deltaPct: number | null;
  monthlyTotals?: number[];
  monthlyKeys?: string[];
  monthlyTotalsPrev?: number[];
  monthlyKeysPrev?: string[];
};

export type TownsTotalsResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  items: TownTotalsItem[];
};

const toYYYYMMDD = (iso: string) => iso.replaceAll("-", "");

function sumOutput(
  output: Record<string, { time: string; value: number }[]>
): number {
  let acc = 0;
  for (const arr of Object.values(output)) {
    for (const p of arr) acc += p.value || 0;
  }
  return acc;
}

export async function getTownsTotalsChatbot(
  granularity: Granularity,
  time?: { startISO: string; endISO: string } | { endISO?: string } | string,
  signal?: AbortSignal
): Promise<TownsTotalsResponse> {
  // const startISO = typeof time === "object" && time && "startISO" in time ? time.startISO : undefined; // TEMPORALMENTE NO USADO
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

  let items;
  if (granularity === "y") {
    // ✨ OPTIMIZACIÓN: Una sola llamada para todos los towns (granularidad anual)

    const [curResp, prvResp] = await Promise.all([
      fetchChatbotTags(
        {
          pattern: `root.*`, // Patrón que cubre todos los towns
          granularity: "d" as ChatbotGranularity,
          startTime: toYYYYMMDD(current.start),
          endTime: toYYYYMMDD(current.end),
        },
        { signal }
      ),
      fetchChatbotTags(
        {
          pattern: `root.*`, // Patrón que cubre todos los towns
          granularity: "d" as ChatbotGranularity,
          startTime: toYYYYMMDD(previous.start),
          endTime: toYYYYMMDD(previous.end),
        },
        { signal }
      ),
    ]);

    // Construir ejes de tiempo usando datos completos
    const axis = buildAxisFromChatbot(curResp.output, "y");
    const prevAxis = buildAxisFromChatbot(prvResp.output, "y");

    // Función para sumar por mes usando datos filtrados
    const sumByMonth = (
      output: Record<string, { time: string; value: number }[]>,
      keys: string[]
    ) => {
      const map = new Map<string, number>();
      Object.values(output ?? {}).forEach((arr) => {
        (arr ?? []).forEach((p) => {
          let key;
          if (p && typeof p.time === "string" && p.time.length === 8) {
            key = `${p.time.slice(0, 4)}/${p.time.slice(4, 6)}`;
          } else if (
            p &&
            typeof p.time === "string" &&
            p.time.length === 7 &&
            p.time.includes("/")
          ) {
            key = p.time;
          } else if (p && typeof p.time === "string") {
            key = p.time;
          } else {
            key = "";
          }
          if (key) map.set(key, (map.get(key) ?? 0) + (p.value || 0));
        });
      });
      return keys.map((k) => map.get(k) ?? 0);
    };

    items = TOWN_ID_ORDER.map((town) => {
      // Filtrar datos por town del resultado completo
      const townPattern = new RegExp(`^root\\.${town}\\.`);

      const currentData: Record<string, { time: string; value: number }[]> = {};
      const previousData: Record<string, { time: string; value: number }[]> =
        {};

      // Filtrar current data
      for (const [key, values] of Object.entries(curResp.output || {})) {
        if (townPattern.test(key)) {
          currentData[key] = values;
        }
      }

      // Filtrar previous data
      for (const [key, values] of Object.entries(prvResp.output || {})) {
        if (townPattern.test(key)) {
          previousData[key] = values;
        }
      }

      const curMonths = sumByMonth(currentData, axis.keysOrdered);
      const prevMonths = sumByMonth(previousData, prevAxis.keysOrdered);
      const total = curMonths.reduce((a, b) => a + b, 0);
      const prev = prevMonths.reduce((a, b) => a + b, 0);
      const deltaPct = prev > 0 ? ((total - prev) / prev) * 100 : null;

      return {
        id: town,
        title: town,
        total,
        previousTotal: prev,
        deltaPct,
        monthlyTotals: curMonths,
        monthlyKeys: axis.keysOrdered,
        monthlyTotalsPrev: prevMonths,
        monthlyKeysPrev: prevAxis.keysOrdered,
      };
    });
  } else {
    // ✨ OPTIMIZACIÓN: Una sola llamada para todos los towns en lugar de 30 llamadas individuales

    const [curResp, prvResp] = await Promise.all([
      fetchChatbotTags(
        {
          pattern: `root.*`, // Patrón que cubre todos los towns
          granularity: "d" as ChatbotGranularity,
          startTime: curStart,
          endTime: curEnd,
        },
        { signal }
      ),
      fetchChatbotTags(
        {
          pattern: `root.*`, // Patrón que cubre todos los towns
          granularity: "d" as ChatbotGranularity,
          startTime: prvStart,
          endTime: prvEnd,
        },
        { signal }
      ),
    ]);

    // Procesar datos localmente por town
    items = TOWN_ID_ORDER.map((town) => {
      // Filtrar datos por town del resultado completo
      const townPattern = new RegExp(`^root\\.${town}\\.`);

      const currentData: Record<string, { time: string; value: number }[]> = {};
      const previousData: Record<string, { time: string; value: number }[]> =
        {};

      // Filtrar current data
      for (const [key, values] of Object.entries(curResp.output || {})) {
        if (townPattern.test(key)) {
          currentData[key] = values;
        }
      }

      // Filtrar previous data
      for (const [key, values] of Object.entries(prvResp.output || {})) {
        if (townPattern.test(key)) {
          previousData[key] = values;
        }
      }

      const total = sumOutput(currentData);
      const prev = sumOutput(previousData);
      const deltaPct = prev > 0 ? ((total - prev) / prev) * 100 : null;

      return {
        id: town,
        title: town,
        total,
        previousTotal: prev,
        deltaPct,
      } as TownTotalsItem;
    });
  }

  return {
    granularity,
    range: { current, previous },
    property: "chatbot",
    items,
  };
}
