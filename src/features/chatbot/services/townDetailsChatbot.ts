import { fetchChatbotTags, type ChatbotGranularity } from "@/lib/api/chatbot";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { buildWindowSets } from "@/lib/utils/windowPolicy";

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
  const sets = buildWindowSets({ granularity, endISO });
  const curBuckets = sets.series.buckets;
  const prvRange = sets.series.previous;

  const unionResp = await fetchChatbotTags({
    pattern: `root.${townId}.*`,
    granularity: "d" as ChatbotGranularity,
    startTime: sets.series.query.start.replaceAll("-", ""),
    endTime: sets.series.query.end.replaceAll("-", ""),
  });

  const current: SeriesPoint[] = curBuckets.map((b) => ({
    label: b.label,
    value: sumPointsInRange(unionResp.output, b.start, b.end),
  }));

  // PREVIOUS con misma longitud que CURRENT
  const prevBuckets = (() => {
    if (curBuckets.length === 0) return [];
    if (sets.series.bucket.unit === "month") {
      const out: Array<{ start: string; end: string; label: string }> = [];
      const s = new Date(prvRange.start + "T00:00:00Z");
      const e = new Date(prvRange.end + "T00:00:00Z");
      let cur = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1));
      const end = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), 1));
      while (cur <= end) {
        const y = cur.getUTCFullYear();
        const m = String(cur.getUTCMonth() + 1).padStart(2, "0");
        const start = `${y}-${m}-01`;
        const endD = new Date(Date.UTC(y, cur.getUTCMonth() + 1, 0));
        out.push({
          start,
          end: endD.toISOString().slice(0, 10),
          label: `${y}-${m}`,
        });
        cur = new Date(Date.UTC(y, cur.getUTCMonth() + 1, 1));
      }
      return out.slice(-curBuckets.length);
    }
    // day buckets (1/7/15/30)
    const size = (sets.series.bucket as { unit: "day"; size: 1 | 7 | 15 | 30 })
      .size;
    const addDays = (d: Date, n: number) => {
      const x = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
      );
      x.setUTCDate(x.getUTCDate() + n);
      return x;
    };
    const toISO = (d: Date) => d.toISOString().slice(0, 10);

    const s = new Date(prvRange.start + "T00:00:00Z");
    const e = new Date(prvRange.end + "T00:00:00Z");
    const out: Array<{ start: string; end: string; label: string }> = [];
    let curS = s;
    while (curS <= e) {
      const curE = addDays(curS, size - 1);
      const end = curE > e ? e : curE;
      out.push({ start: toISO(curS), end: toISO(end), label: toISO(curS) });
      curS = addDays(end, 1);
    }
    return out.slice(-curBuckets.length);
  })();

  const previous: SeriesPoint[] = prevBuckets.map((b) => ({
    label: "",
    value: sumPointsInRange(unionResp.output, b.start, b.end),
  }));

  // DONUT = SOLO último bucket de CURRENT (sin segunda llamada)
  const last = curBuckets[curBuckets.length - 1] ?? sets.donut.current;
  const donut = donutFromCategoryMap(unionResp.output, last.start, last.end);

  return { current, previous, donut };
}
