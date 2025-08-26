"use client";

import * as React from "react";
import TagStat from "@/components/dashboard/TagsStat";
import GranularityTabs from "./GranularityTabs";
import PagerDots from "./PagerDots";
import { useTopTags } from "@/hooks/useTopTags";
import LineChart from "@/components/charts/LineChart";
import { buildTrendForTags } from "@/lib/chatbot/tags";
import { SERIES } from "@/lib/mockData";
import SectionTitle from "@/components/common/SectionTitle";

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

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {subtitle} — {rangeLabel}
          </p>
        </div>
        <GranularityTabs value={gran} onChange={setGran} />
      </div>

      <div className="grid grid-cols-12 gap-6 items-stretch">
        {/* 1/3: lista */}
        <div className="col-span-12 lg:col-span-4">
          {view.map(({ tag, total }) => {
            const meta = tagMeta[tag] ?? defaultTagMeta;
            return (
              <TagStat
                key={tag}
                label={meta.label}
                count={total}
                icon={meta.icon}
                iconClassName={meta.color}
              />
            );
          })}
          <PagerDots page={page} pages={pages} onPrev={prev} onNext={next} />
        </div>

        {/* 2/3: gráfica (sin fondo/borde) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col">
          <div className="p-2 flex flex-col flex-1">
            <div className="mb-3">
              <SectionTitle
                title="Tendencia por tags (líneas)"
                subtitle="Comparación de vistas por tag en el tiempo"
              />
            </div>

            {/* Wrapper del chart: ocupa todo el alto disponible y tiene min-height responsivo */}
            <div className="flex-1 min-h-0 h-full min-h-[320px] sm:min-h-[360px] lg:min-h-[320px]">
              <LineChart
                type="area"
                smooth
                categories={trend.categories}
                series={trend.series.map((s) => ({
                  name: tagMeta[s.name]?.label ?? s.name,
                  data: s.data,
                }))}
                showLegend
                legendPosition="bottom"
                height="100%"   // llena el contenedor
                className="h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
