import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { labelToCategoryId } from "@/lib/utils/core/sector";
import type { QueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import type { Drill, Level2Data } from "./types";

export function useTownDrill(
  calculatedGranularity: Granularity,
  currentPeriod: { start: string; end: string },
  queryClient: QueryClient,
) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drill, setDrill] = useState<Drill | null>(null);

  const townId = expandedId as TownId | null;

  const handleOpen = useCallback((id: string) => {
    setExpandedId(id);
    setDrill({ kind: "town", townId: id as TownId });
  }, []);

  const handleSliceClick = useCallback(
    (label: string) => {
      const categoryId = labelToCategoryId(label);

      if (categoryId && expandedId) {
        const newDrill = {
          kind: "town+cat" as const,
          townId: expandedId as TownId,
          categoryId,
        };

        if (drill?.kind === "town+cat") {
          queryClient.invalidateQueries({
            queryKey: ["drilldown-details"],
          });
        }

        setDrill(newDrill);
      }
    },
    [expandedId, drill, queryClient],
  );

  const handleClose = useCallback(() => {
    setExpandedId(null);
    setDrill(null);
  }, []);

  const handleCloseLevel2 = useCallback(() => {
    setDrill(null);
  }, []);

  const level2Data = useMemo(() => {
    if (!drill || drill.kind !== "town+cat") return undefined;

    const result: Level2Data = {
      townId: drill.townId,
      categoryId: drill.categoryId,
      granularity: calculatedGranularity,
      startISO: currentPeriod.start,
      endISO: currentPeriod.end,
    };

    return result;
  }, [drill, calculatedGranularity, currentPeriod]);

  const gridKey = useMemo(() => {
    const base = `g=${calculatedGranularity}|end=${currentPeriod.end}|exp=${
      expandedId ?? ""
    }`;
    if (drill?.kind === "town+cat")
      return `${base}|town=${drill.townId}|cat=${drill.categoryId}`;
    if (drill?.kind === "town") return `${base}|town=${drill.townId}`;
    return base;
  }, [calculatedGranularity, currentPeriod.end, expandedId, drill]);

  return {
    expandedId,
    townId,
    drill,
    level2Data,
    gridKey,
    handleOpen,
    handleSliceClick,
    handleClose,
    handleCloseLevel2,
  };
}
