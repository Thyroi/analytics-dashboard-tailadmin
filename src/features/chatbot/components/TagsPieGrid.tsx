// src/components/analytics/TagsPieGrid.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import PieChart, { type PieDatum } from "@/components/charts/PieChart";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";
import { tags, type TagCountItem } from "@/lib/analytics/adapter";
import { fmt, lastNDays } from "@/lib/analytics/utils";

const PROJECT = "project_huelva";

export default function TagsPieGrid() {
  const { start, end } = lastNDays(30);
  const [range] = useState({ start: fmt(start), end: fmt(end) });

  const [top, setTop] = useState<TagCountItem[]>([]);
  const [subsMap, setSubsMap] = useState<Record<string, TagCountItem[]>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar tags de primer nivel y subtags de cada uno
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSubsMap({});
    setTop([]);

    (async () => {
      const topTags = await tags({
        projectId: PROJECT,
        start: range.start,
        end: range.end,
      });
      if (cancelled) return;
      setTop(topTags);

      const pairs = await Promise.all(
        topTags.map(async (t) => {
          const list = await tags({
            projectId: PROJECT,
            tagPath: t.tagPath, // subtags de ese tag
            start: range.start,
            end: range.end,
          });
          return [t.tagPath, list] as const;
        })
      );
      if (cancelled) return;

      const map: Record<string, TagCountItem[]> = {};
      for (const [k, list] of pairs) map[k] = list;
      setSubsMap(map);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [range.start, range.end]);

  // Armar tarjetas para el grid
  const cards = useMemo(
    () =>
      top.map((t) => {
        const subs = subsMap[t.tagPath] ?? [];
        const data: PieDatum[] = subs.map((s) => ({
          label: s.label,
          value: s.count,
        }));
        return {
          key: t.tagPath,
          label: t.label,
          total: t.count,
          data,
        };
      }),
    [top, subsMap]
  );

  const showSkeletons = loading && cards.length === 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {showSkeletons
        ? Array.from({ length: 6 }).map((_, i) => (
            <ChartSkeleton key={i} height={260} />
          ))
        : cards.map((card) => (
            <div
              key={card.key}
              className="
                rounded-2xl p-4
                border border-gray-200 dark:border-white/10
                bg-white dark:bg-[#14181e]
              "
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                    {card.label}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total: {card.total.toLocaleString()}
                  </p>
                </div>
              </div>

              {card.data.length === 0 ? (
                <div className="h-[220px] rounded-xl border border-dashed border-gray-200 dark:border-white/10 grid place-content-center text-sm text-gray-500 dark:text-gray-400">
                  Sin subtags
                </div>
              ) : (
                <PieChart
                  type="donut"
                  data={card.data}
                  height={260}
                  donutTotalLabel="Total"
                  dataLabels="percent"
                />
              )}
            </div>
          ))}
    </div>
  );
}
