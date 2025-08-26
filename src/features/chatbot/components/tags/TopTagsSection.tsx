"use client";

import LineChart from "@/components/charts/LineChart";
import * as React from "react";
import GranularityTabs from "./GranularityTabs";
import TagsDrawer from "./TagsDrawer";

import Header from "@/components/common/Header";
import { useTopTags } from "@/hooks/useTopTags";
import { buildTrendForTags } from "@/lib/chatbot/tags";
import { SERIES, TAG_COLOR_HEX_BY_LABEL, TAG_META } from "@/lib/mockData";

type HeroIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;
type TagMetaEntry = { label: string; icon: HeroIcon; color: string };
type TagMetaMap = Record<string, TagMetaEntry>;

export default function TopTagsSection({
  tagMeta,
  defaultTagMeta,
  pageSize = 5,
  title = "Top tags",
  subtitle = "Según granularidad seleccionada",
}: {
  tagMeta: TagMetaMap;
  defaultTagMeta: TagMetaEntry;
  pageSize?: number;
  title?: string;
  subtitle?: string;
}) {
  const { gran, setGran, page, pages, view, rangeLabel, next, prev } =
    useTopTags(pageSize);

  const visibleTags = React.useMemo(() => view.map((v) => v.tag), [view]);
  const trend = React.useMemo(
    () => buildTrendForTags(SERIES, visibleTags, gran),
    [visibleTags, gran]
  );

  const colorsByName = React.useMemo(() => TAG_COLOR_HEX_BY_LABEL, []);

  return (
    <section className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <Header title={title} subtitle={`${subtitle} — ${rangeLabel}`} />
        <GranularityTabs value={gran} onChange={setGran} />
      </div>

      <div className="space-y-6">
        {/* Drawer de tags con paginado */}
        <TagsDrawer
          rows={view}
          tagMeta={tagMeta}
          defaultTagMeta={defaultTagMeta}
          page={page}
          pages={pages}
          onPrev={prev}
          onNext={next}
        />

        {/* GRÁFICA */}
        <div className="mt-3 w-full h-[320px] sm:h-[360px] lg:h-[420px]">
          <LineChart
            type="area"
            smooth
            categories={trend.categories}
            series={trend.series.map((s) => {
              const meta = TAG_META[s.name] ?? defaultTagMeta;
              return { name: meta.label, data: s.data };
            })}
            showLegend
            legendPosition="bottom"
            height="100%"
            className="h-full"
            colorsByName={colorsByName}
          />
        </div>
      </div>
    </section>
  );
}
