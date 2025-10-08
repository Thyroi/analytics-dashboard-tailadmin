import { fetchChatbotTags, type ChatbotGranularity } from "@/lib/api/chatbot";
import { buildAxisFromChatbot } from "@/lib/utils/timeAxisChatbot";

type SubLine = { name: string; data: number[]; path: string };

export async function getTownCategoryDrilldown({
  townId,
  categoryId,
  granularity,
  startTime,
  endTime,
}: {
  townId: string;
  categoryId: string;
  granularity: ChatbotGranularity;
  startTime?: string;
  endTime?: string;
}) {
  const { output } = await fetchChatbotTags({
    pattern: `root.${townId}.${categoryId}.*`,
    granularity,
    startTime,
    endTime,
  });

  const { keysOrdered, xLabels } = buildAxisFromChatbot(output, granularity);

  // Donut por sub (último segmento)
  const donutMap = new Map<string, number>();
  for (const [tag, series] of Object.entries(output)) {
    const parts = tag.split(".");
    const sub = parts[3] ?? "general";
    const sum = series.reduce((a, p) => a + (p.value || 0), 0);
    donutMap.set(sub, (donutMap.get(sub) ?? 0) + sum);
  }
  const donut = [...donutMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  // Multilínea por sub
  const subs = [...donutMap.keys()];
  const seriesBySub: SubLine[] = subs.map((sub) => {
    const acc = new Map<string, number>();
    for (const [tag, series] of Object.entries(output)) {
      if (tag.endsWith(`.${sub}`)) {
        series.forEach(({ time, value }) =>
          acc.set(time, (acc.get(time) ?? 0) + (value || 0))
        );
      }
    }
    const data = keysOrdered.map((k) => acc.get(k) ?? 0);
    return { name: sub, data, path: `/${townId}/${categoryId}/${sub}` };
  });

  return { xLabels, donut, seriesBySub };
}
