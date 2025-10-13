// src/features/chatbot/hooks/useCategoryDetailsChatbot.ts
"use client";

import { fetchChatbotTags, type ChatbotGranularity } from "@/lib/api/chatbot";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { TOWN_ID_ORDER, TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { buildWindowSets } from "@/lib/utils/core/windowPolicy";
import { useQuery } from "@tanstack/react-query";

/* ---------- helpers ---------- */
const gToChatbot = (g: Granularity) => g as ChatbotGranularity;
const toYYYYMMDD = (iso: string) => iso.replaceAll("-", "");
const TOWN_KEYS: readonly TownId[] = TOWN_ID_ORDER;
const isTownId = (x: string): x is TownId =>
  (TOWN_KEYS as readonly string[]).includes(x);

function sumPointsInRange(
  output: Record<string, { time: string; value: number }[]>,
  startISO: string,
  endISO: string
) {
  const s = toYYYYMMDD(startISO);
  const e = toYYYYMMDD(endISO);
  let total = 0;
  for (const arr of Object.values(output)) {
    for (const p of arr) if (p.time >= s && p.time <= e) total += p.value || 0;
  }
  return total;
}

function donutFromTownMap(
  output: Record<string, { time: string; value: number }[]>,
  startISO: string,
  endISO: string
): DonutDatum[] {
  const s = toYYYYMMDD(startISO);
  const e = toYYYYMMDD(endISO);
  const m = new Map<TownId, number>();
  for (const [tag, arr] of Object.entries(output)) {
    const parts = tag.split(".");
    const town = parts[1] as TownId | undefined;
    if (!town || !(town in TOWN_META)) continue;

    let sum = 0;
    for (const p of arr) if (p.time >= s && p.time <= e) sum += p.value || 0;
    if (sum > 0) m.set(town, (m.get(town) ?? 0) + sum);
  }
  return [...m.entries()]
    .map(([town, value]) => ({ label: TOWN_META[town].label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

/**
 * Devuelve:
 * - series.current: suma por buckets de CURRENT (según windowPolicy)
 * - series.previous: mismos buckets pero en PREVIOUS (misma longitud)
 * - donutData: suma SOLO del último bucket de CURRENT
 *   - si g="d" → solo AYER
 *   - si g="w/m/y" → el último bucket (7/15/30 días o mes, según windowPolicy)
 */
export function useCategoryDetailsChatbot(
  categoryId: CategoryId,
  granularity: Granularity,
  endISO?: string
) {
  return useQuery({
    queryKey: ["chatbot:catDetails", categoryId, granularity, endISO ?? null],
    queryFn: async () => {
      const sets = buildWindowSets({ granularity, endISO });

      const curBuckets = sets.series.buckets;
      const prvRange = sets.series.previous;

      // FETCH ÚNICA (diaria) sobre la ventana unificada prev.start → curr.end
      const unionResp = await fetchChatbotTags({
        pattern: `root.*.${categoryId}.*`,
        granularity: "d" as ChatbotGranularity,
        startTime: toYYYYMMDD(sets.series.query.start),
        endTime: toYYYYMMDD(sets.series.query.end),
      });

      // CURRENT por buckets
      const current: SeriesPoint[] = curBuckets.map((b) => ({
        label: b.label,
        value: sumPointsInRange(unionResp.output, b.start, b.end),
      }));

      // PREVIOUS con misma longitud que CURRENT
      const prevBuckets = (() => {
        if (curBuckets.length === 0) return [];
        if (sets.series.bucket.unit === "month") {
          // meses completos del rango previous
          const out: Array<{ start: string; end: string; label: string }> = [];
          const s = new Date(prvRange.start + "T00:00:00Z");
          const e = new Date(prvRange.end + "T00:00:00Z");
          let cur = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1));
          const end = new Date(
            Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), 1)
          );
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
        const size = (
          sets.series.bucket as { unit: "day"; size: 1 | 7 | 15 | 30 }
        ).size;
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
      const donut = donutFromTownMap(unionResp.output, last.start, last.end);

      return { current, previous, donut };
    },
  });
}
