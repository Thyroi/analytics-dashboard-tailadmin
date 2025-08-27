import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTopTagsCtx } from "@/features/chatbot/context/TopTagsCtx";
import { SERIES, TAG_META, TAG_COLOR_HEX_BY_LABEL } from "@/lib/mockData";
import {
  datesForGranularity,
  type Granularity,
  buildSubtagRows,
  type SubtagRow,
} from "@/lib/chatbot/tags";
import { generateDistinctColors, buildDonutOptions } from "@/lib/chatbot/trendUtils";
import type { PieDatum } from "@/components/charts/PieChart";

export function useSubtagsData() {
  const { activeTag, setActiveTag, allRootTags, gran: globalGran } = useTopTagsCtx();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subGran, setSubGran] = React.useState<Granularity>(globalGran);
  const tag = activeTag ?? allRootTags[0] ?? "";

  const replaceTagInUrl = React.useCallback(
    (nextTag: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextTag) params.set("tag", nextTag); else params.delete("tag");
      if (params.get("tag") === searchParams.get("tag")) return;
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
  React.useEffect(() => { if (tag) replaceTagInUrl(tag); }, [tag, replaceTagInUrl]);

  // ⬅️ Ventana diaria concreta (lista de dates) y su set
  const windowDates = React.useMemo(() => datesForGranularity(SERIES, subGran), [subGran]);
  const windowDays = React.useMemo(() => new Set(windowDates), [windowDates]);

  // Filas de subtags (sumadas sobre windowDays)
  const rows: SubtagRow[] = React.useMemo(() => buildSubtagRows(SERIES, tag, windowDays), [tag, windowDays]);

  // Donut data
  const donutData: PieDatum[] = React.useMemo(
    () => rows.filter((r) => r.total > 0).map((r) => ({ label: r.label, value: r.total })),
    [rows]
  );

  // Paleta base consistente con el tag raíz
  const rootLabel = TAG_META[tag]?.label ?? tag;
  const baseHex = TAG_COLOR_HEX_BY_LABEL[rootLabel];
  const colorsByLabel = React.useMemo(
    () => generateDistinctColors(donutData.map((d) => d.label), baseHex, { minHueDelta: 18, sat: 72, light: 55 }),
    [donutData, baseHex]
  );

  const totalVisible = React.useMemo(() => rows.reduce((a, r) => a + r.total, 0), [rows]);

  // alturas UI
  const donutHeight = 260;
  const compareHeight = 300;

  const subtitleSuffix =
    subGran === "day"  ? "últimos 30 días" :
    subGran === "week" ? "últimas 8 semanas" :
                         "últimos 6 meses";

  const tagOptions = React.useMemo(
    () => allRootTags.map((t) => ({ value: t, label: TAG_META[t]?.label ?? t })),
    [allRootTags]
  );

  const donutOptions = React.useMemo(
    () => buildDonutOptions((v) => Intl.NumberFormat().format(v), "Total", "68%"),
    []
  );

  const onChangeTag = React.useCallback(
    (next: string) => { setActiveTag(next); replaceTagInUrl(next); },
    [setActiveTag, replaceTagInUrl]
  );

  return {
    tag, subGran, setSubGran, onChangeTag,
    // ventana
    windowDates,
    // datos
    rows, donutData, colorsByLabel, totalVisible,
    // UI helpers
    donutHeight, compareHeight, subtitleSuffix,
    tagOptions, donutOptions,
  };
}
