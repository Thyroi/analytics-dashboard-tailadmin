"use client";

import { useEffect, useMemo, useState } from "react";
import { tags, type TagCountItem } from "@/lib/analytics/adapter";
import { fmt, lastNDays } from "@/lib/analytics/utils";
import SingleTagAnalytics from "./SingleTagAnalytics";
import AnalyticsTagsSkeleton from "@/components/skeletons/AnalyticsTagsSkeleton";

type Props = {
  projectId?: string;
  /** Limitar a los primeros N tags de primer nivel */
  topN?: number;
  /** intervalo de refresco para donuts (ms). 0 = sin refresco */
  donutRefreshMs?: number;
};

export default function AllTagsAnalyticsGrid({
  projectId = "project_huelva",
  topN = 3,
  donutRefreshMs = 5000,
}: Props) {
  const { start, end } = lastNDays(30);
  const range = useMemo(() => ({ start: fmt(start), end: fmt(end) }), [start, end]);

  const [top, setTop] = useState<TagCountItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const list = await tags({
          projectId,
          start: range.start,
          end: range.end,
        });
        if (!cancelled) setTop(list.slice(0, topN));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, range.start, range.end, topN]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <AnalyticsTagsSkeleton />
        <AnalyticsTagsSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {top.map((t) => (
        <SingleTagAnalytics
          key={t.tagPath}
          tagPath={t.tagPath}
          projectId={projectId}
          start={range.start}
          end={range.end}
          donutRefreshMs={donutRefreshMs}
        />
      ))}
    </div>
  );
}
