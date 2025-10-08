import { fetchChatbotTags, type ChatbotGranularity } from "@/lib/api/chatbot";
import { TOWN_ID_ORDER, type TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { buildWindowSets } from "@/lib/utils/windowPolicy";

export type TownTotalsItem = {
  id: TownId;
  title: string;
  total: number;
  deltaPct: number | null;
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

  const sets = buildWindowSets({ granularity, startISO, endISO });
  const current = sets.donut.current;
  const previous = sets.range.previous;

  const curStart = toYYYYMMDD(current.start);
  const curEnd = toYYYYMMDD(current.end);
  const prvStart = toYYYYMMDD(previous.start);
  const prvEnd = toYYYYMMDD(previous.end);

  const items = await Promise.all(
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

  return {
    granularity,
    range: { current: sets.range.current, previous: sets.range.previous },
    property: "chatbot",
    items,
  };
}
