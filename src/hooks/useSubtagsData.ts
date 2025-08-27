// src/hooks/useSubtagsData.ts
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTopTagsCtx } from "@/features/chatbot/context/TopTagsCtx";
import { SERIES, TAG_META, TAG_COLOR_HEX_BY_LABEL } from "@/lib/mockData";
import {
  datesForGranularity,
  type Granularity,
  buildSubtagRows,
  type SubtagRow,
  getLastDate,
} from "@/lib/chatbot/tags";
import {
  generateDistinctColors,
  buildDonutOptions,
  type DonutOptions,
  parseISO,
  addDays,
  startOfWeekUTC,
  startOfMonthUTC,
  endOfMonthUTC,
} from "@/lib/chatbot/trendUtils";
import type { PieDatum } from "@/components/charts/PieChart";

function fmtRangeUTC(start: Date, end: Date): string {
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const startStr = start.toLocaleDateString("es", {
    day: "2-digit",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
  const endStr = end.toLocaleDateString("es", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${startStr} – ${endStr}`;
}

export function useSubtagsData() {
  const { activeTag, setActiveTag, allRootTags, gran: globalGran } = useTopTagsCtx();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subGran, setSubGran] = React.useState<Granularity>(globalGran);
  const tag = activeTag ?? allRootTags[0] ?? "";

  const replaceTagInUrl = React.useCallback(
    (nextTag: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextTag) params.set("tag", nextTag);
      else params.delete("tag");
      if (params.get("tag") === searchParams.get("tag")) return;
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
  React.useEffect(() => {
    if (tag) replaceTagInUrl(tag);
  }, [tag, replaceTagInUrl]);

  // Ventana de fechas (días) y su Set para sumar
  const windowDates = React.useMemo(() => datesForGranularity(SERIES, subGran), [subGran]);
  const windowDays = React.useMemo(() => new Set(windowDates), [windowDates]);

  // Rango legible (UTC) según granularidad
  const dateRangeLabel = React.useMemo(() => {
    const lastISO = getLastDate(SERIES);
    if (!lastISO) return "";
    const last = parseISO(lastISO)!;

    if (subGran === "day") {
      if (!windowDates.length) return "";
      const start = parseISO(windowDates[0])!;
      const end = parseISO(windowDates[windowDates.length - 1])!;
      return fmtRangeUTC(start, end);
    }

    if (subGran === "week") {
      // 8 semanas: desde el lunes de la primera hasta el domingo de la última
      const lastWeekStart = startOfWeekUTC(last);
      const firstWeekStart = addDays(lastWeekStart, -7 * (8 - 1));
      const rangeStart = firstWeekStart;
      const rangeEnd = addDays(lastWeekStart, 6);
      return fmtRangeUTC(rangeStart, rangeEnd);
    }

    // month → 6 meses completos
    const endMonthStart = startOfMonthUTC(last);
    const startMonthStart = new Date(
      Date.UTC(endMonthStart.getUTCFullYear(), endMonthStart.getUTCMonth() - 5, 1)
    );
    const rangeStart = startMonthStart;
    const rangeEnd = endOfMonthUTC(endMonthStart);
    return fmtRangeUTC(rangeStart, rangeEnd);
  }, [subGran, windowDates]);

  // Filas de subtags (sumadas en la ventana)
  const rows: SubtagRow[] = React.useMemo(
    () => buildSubtagRows(SERIES, tag, windowDays),
    [tag, windowDays]
  );

  // Donut data
  const donutData: PieDatum[] = React.useMemo(
    () => rows.filter((r) => r.total > 0).map((r) => ({ label: r.label, value: r.total })),
    [rows]
  );

  // Paleta base coherente con el tag raíz
  const rootLabel = TAG_META[tag]?.label ?? tag;
  const baseHex = TAG_COLOR_HEX_BY_LABEL[rootLabel];
  const colorsByLabel = React.useMemo(
    () =>
      generateDistinctColors(donutData.map((d) => d.label), baseHex, {
        minHueDelta: 18,
        sat: 72,
        light: 55,
      }),
    [donutData, baseHex]
  );

  const totalVisible = React.useMemo(
    () => rows.reduce((a, r) => a + r.total, 0),
    [rows]
  );

  // Alturas UI
  const donutHeight = 260;
  const compareHeight = 300;

  const subtitleSuffix =
    subGran === "day"
      ? "últimos 30 días"
      : subGran === "week"
      ? "últimas 8 semanas"
      : "últimos 6 meses";

  const tagOptions = React.useMemo(
    () => allRootTags.map((t) => ({ value: t, label: TAG_META[t]?.label ?? t })),
    [allRootTags]
  );

  // Base options (tooltip con valores absolutos)
  const donutOptionsBase: DonutOptions = React.useMemo(
    () => buildDonutOptions((v) => Intl.NumberFormat().format(v), "Total", "68%"),
    []
  );

  // Donut con % en el centro (y sin bloque "Total")
  const donutOptions: DonutOptions = React.useMemo(() => {
    const pctFormatter = (raw: string): string => {
      const n = Number(raw || 0);
      const pct = totalVisible > 0 ? (n / totalVisible) * 100 : 0;
      return `${Math.round(pct)}%`;
    };
    return {
      plotOptions: {
        pie: {
          expandOnClick: donutOptionsBase.plotOptions.pie.expandOnClick,
          donut: {
            size: donutOptionsBase.plotOptions.pie.donut.size,
            labels: {
              show: true,
              name: { ...donutOptionsBase.plotOptions.pie.donut.labels.name },
              value: {
                ...donutOptionsBase.plotOptions.pie.donut.labels.value,
                formatter: pctFormatter,
              },
              total: {
                ...donutOptionsBase.plotOptions.pie.donut.labels.total,
                show: false,
              },
            },
          },
        },
      },
      tooltip: donutOptionsBase.tooltip,
    };
  }, [donutOptionsBase, totalVisible]);

  const onChangeTag = React.useCallback(
    (next: string) => {
      setActiveTag(next);
      replaceTagInUrl(next);
    },
    [setActiveTag, replaceTagInUrl]
  );

  return {
    tag,
    subGran,
    setSubGran,
    onChangeTag,
    // ventana
    windowDates,
    dateRangeLabel,
    // datos
    rows,
    donutData,
    colorsByLabel,
    totalVisible,
    // UI
    donutHeight,
    compareHeight,
    subtitleSuffix,
    tagOptions,
    donutOptions,
  };
}
