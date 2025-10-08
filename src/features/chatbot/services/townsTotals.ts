import { fetchChatbotTags, type ChatbotGranularity } from "@/lib/api/chatbot";
import { TOWN_ID_ORDER, TOWN_META } from "@/lib/taxonomy/towns";
import { buildAxisFromChatbot } from "@/lib/utils/timeAxisChatbot";

type Point = { time: string; value: number };
type Series = { name: string; data: number[] };

export async function getTownsTotals({
  granularity,
  startTime,
  endTime,
}: {
  granularity: ChatbotGranularity;
  startTime?: string;
  endTime?: string;
}) {
  const perTown = await Promise.all(
    TOWN_ID_ORDER.map(async (town) => {
      const { output } = await fetchChatbotTags({
        pattern: `root.${town}.*`,
        granularity,
        startTime,
        endTime,
      });
      return { town, output };
    })
  );

  const mergedMap: Record<string, Point[]> = {};
  for (const { output } of perTown) Object.assign(mergedMap, output);
  const { keysOrdered, xLabels } = buildAxisFromChatbot(mergedMap, granularity);

  const perTownTotals: Record<string, number[]> = {};
  for (const { town, output } of perTown) {
    const acc = new Map<string, number>();
    Object.values(output).forEach((series) => {
      series.forEach(({ time, value }) =>
        acc.set(time, (acc.get(time) ?? 0) + (value || 0))
      );
    });
    perTownTotals[town] = keysOrdered.map((k) => acc.get(k) ?? 0);
  }

  const series: Series[] = TOWN_ID_ORDER.map((town) => ({
    name: TOWN_META[town].label,
    data: perTownTotals[town] ?? keysOrdered.map(() => 0),
  }));

  return { categories: xLabels, series };
}
