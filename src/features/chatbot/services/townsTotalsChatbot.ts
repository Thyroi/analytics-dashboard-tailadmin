import { fetchChatbotTags, type ChatbotGranularity } from "@/lib/api/chatbot";
import { TOWN_ID_ORDER, type TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { parseISO } from "@/lib/utils/datetime";
import { buildAxisFromChatbot } from "@/lib/utils/timeAxisChatbot";
import {
  deriveRangeEndingYesterday,
  getDonutWindow,
  shiftRangeByDays,
} from "@/lib/utils/windowPolicyAnalytics";

export type TownTotalsItem = {
  id: TownId;
  title: string;
  total: number;
  deltaPct: number | null;
  monthlyTotals?: number[];
  monthlyKeys?: string[];
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

  let items;
  if (granularity === "y") {
    // Consulta mensual, eje y buckets de 12 meses
    items = await Promise.all(
      TOWN_ID_ORDER.map(async (town) => {
        const [curResp, prvResp] = await Promise.all([
          fetchChatbotTags(
            {
              pattern: `root.${town}.*`,
              granularity: "m" as ChatbotGranularity, // mensual
              startTime: toYYYYMMDD(current.start),
              endTime: toYYYYMMDD(current.end),
            },
            { signal }
          ),
          fetchChatbotTags(
            {
              pattern: `root.${town}.*`,
              granularity: "m" as ChatbotGranularity, // mensual
              startTime: toYYYYMMDD(previous.start),
              endTime: toYYYYMMDD(previous.end),
            },
            { signal }
          ),
        ]);
        // Eje de meses
        const axis = buildAxisFromChatbot(curResp.output, "y");
        const prevAxis = buildAxisFromChatbot(prvResp.output, "y");
        // buckets mensuales
        const getBuckets = (
          output: Record<string, { time: string; value: number }[]>,
          keys: string[]
        ) => {
          const map = new Map<string, number>();
          for (const arr of Object.values(output)) {
            for (const p of arr) {
              map.set(p.time, (map.get(p.time) ?? 0) + (p.value || 0));
            }
          }
          return keys.map((k) => map.get(k) ?? 0);
        };
        const curMonths = getBuckets(curResp.output, axis.keysOrdered);
        const prevMonths = getBuckets(prvResp.output, prevAxis.keysOrdered);
        const total = curMonths.reduce((a, b) => a + b, 0);
        const prev = prevMonths.reduce((a, b) => a + b, 0);
        const deltaPct = prev > 0 ? ((total - prev) / prev) * 100 : null;
        return {
          id: town,
          title: town,
          total,
          deltaPct,
          monthlyTotals: curMonths, // buckets mensuales
          monthlyKeys: axis.keysOrdered, // claves YYYYMM
        };
      })
    );
  } else {
    items = await Promise.all(
      TOWN_ID_ORDER.map(async (town) => {
        const [curResp, prvResp] = await Promise.all([
          fetchChatbotTags(
            {
              pattern: `root.${town}.*`,
              granularity: "d" as ChatbotGranularity,
              startTime: curStart,
              endTime: curEnd,
            },
            { signal }
          ),
          fetchChatbotTags(
            {
              pattern: `root.${town}.*`,
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
          id: town,
          title: town,
          total,
          deltaPct,
        } as TownTotalsItem;
      })
    );
  }

  return {
    granularity,
    range: { current, previous },
    property: "chatbot",
    items,
  };
}
