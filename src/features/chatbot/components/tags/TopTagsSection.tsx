"use client";

import LineChart from "@/components/charts/LineChart";
import Header from "@/components/common/Header";
import * as React from "react";
import TagsDrawer from "../../../../components/common/TagsDrawer";
import GranularityTabs from "../../../../components/dashboard/GranularityTabs";
import DonutTopShareCard from "./DonutTopShareCard";

import { useTopTags } from "@/hooks/useTopTags";
import { buildTrendForTags } from "@/lib/chatbot/tags";
import { SERIES, TAG_COLOR_HEX_BY_LABEL, TAG_META } from "@/lib/mockData";
import TotalSearchesTrendCard from "./TotalSearchesTrendCard";

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
      {/* HEADER ocupa todo el ancho */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Header title={title} subtitle={`${subtitle} — ${rangeLabel}`} />
        <GranularityTabs value={gran} onChange={setGran} />
      </div>

      {/* ROW principal: izquierda 2/3, derecha 1/3 */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        {/* IZQUIERDA: ocupa todo el alto y reparte el espacio alrededor */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full justify-around gap-6">
          {/* Drawer no se estira, mantiene su alto natural */}
          <div className="shrink-0">
            <TagsDrawer
              rows={view}
              tagMeta={tagMeta}
              defaultTagMeta={defaultTagMeta}
              page={page}
              pages={pages}
              onPrev={prev}
              onNext={next}
            />
          </div>

          {/* Chart crece para rellenar el alto disponible */}
          <div className="flex-1 w-full min-h-[320px] sm:min-h-[360px] lg:min-h-[420px]">
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

        {/* DERECHA */}
        <div className="col-span-12 lg:col-span-4 grid gap-4 grid-cols-1 auto-rows-fr">
          <DonutTopShareCard
            rows={view}
            tagMeta={tagMeta}
            defaultTagMeta={defaultTagMeta}
            title="Participación por tag"
            subtitle="Top actual"
            height={160}
          />
          <TotalSearchesTrendCard
            visibleTags={visibleTags}
            categories={trend.categories}
            title="Total de búsquedas"
            subtitle="Último periodo vs. anterior"
            height={220}
            gran={gran}
          />
        </div>
      </div>
    </section>
  );
}
