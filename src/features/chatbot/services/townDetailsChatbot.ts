import { fetchChatbotTags, type ChatbotGranularity } from "@/lib/api/chatbot";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { parseISO } from "@/lib/utils/datetime";
import {
  deriveRangeEndingYesterday,
  enumerateDaysUTC,
  getDonutWindow,
  shiftRangeByDays,
} from "@/lib/utils/windowPolicyAnalytics";

function sumPointsInRange(
  output: Record<string, { time: string; value: number }[]>,
  startISO: string,
  endISO: string
) {
  const s = startISO.replaceAll("-", "");
  const e = endISO.replaceAll("-", "");
  let total = 0;
  for (const arr of Object.values(output)) {
    for (const p of arr) if (p.time >= s && p.time <= e) total += p.value || 0;
  }
  return total;
}

function donutFromCategoryMap(
  output: Record<string, { time: string; value: number }[]>,
  startISO: string,
  endISO: string
): DonutDatum[] {
  const s = startISO.replaceAll("-", "");
  const e = endISO.replaceAll("-", "");
  const m = new Map<string, number>();
  for (const [tag, arr] of Object.entries(output)) {
    const parts = tag.split(".");
    const cat = parts[2] ?? "general";
    let sum = 0;
    for (const p of arr) if (p.time >= s && p.time <= e) sum += p.value || 0;
    if (sum > 0) m.set(cat, (m.get(cat) ?? 0) + sum);
  }
  return [...m.entries()]
    .map(([category, value]) => ({ label: category, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

export async function getTownDetailsChatbot(
  townId: TownId,
  granularity: Granularity,
  endISO?: string
) {
  // Unificar lógica de rangos y donut
  const now = endISO ? parseISO(endISO) : undefined;
  const currPreset = deriveRangeEndingYesterday(granularity, now);
  const currentRange = { start: currPreset.startTime, end: currPreset.endTime };
  const previousRange = shiftRangeByDays(currentRange, -1);
  const donutWindow = getDonutWindow(granularity, currentRange);

  // Buckets para el gráfico de líneas
  const curKeys = enumerateDaysUTC(currentRange.start, currentRange.end);
  const prevKeys = enumerateDaysUTC(previousRange.start, previousRange.end);

  const unionResp = await fetchChatbotTags({
    pattern: `root.${townId}.*`,
    granularity: "d" as ChatbotGranularity,
    startTime: curKeys[0].replaceAll("-", ""),
    endTime: curKeys[curKeys.length - 1].replaceAll("-", ""),
  });

  const current: SeriesPoint[] = curKeys.map((key) => ({
    label: key,
    value: sumPointsInRange(unionResp.output, key, key),
  }));

  const previous: SeriesPoint[] = prevKeys.map((key) => ({
    label: key,
    value: sumPointsInRange(unionResp.output, key, key),
  }));

  // Donut: solo el rango de donutWindow
  const donut = donutFromCategoryMap(
    unionResp.output,
    donutWindow.start,
    donutWindow.end
  );

  return { current, previous, donut };
}
