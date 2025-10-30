import type { CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import { labelToTownId } from "@/lib/utils/core/sector";
import type { QueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import type { Drill, Level2Data } from "./types";

export function useCategoryDrill(
  calculatedGranularity: Granularity,
  currentPeriod: { start: string; end: string },
  queryClient: QueryClient
) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drill, setDrill] = useState<Drill | null>(null);

  const catId = expandedId as CategoryId | null;

  const handleOpen = useCallback((id: string) => {
    setExpandedId(id);
    setDrill({ kind: "category", categoryId: id as CategoryId });
  }, []);

  const handleSliceClick = useCallback(
    (label: string) => {
      const townId = labelToTownId(label);

      if (townId && expandedId) {
        const newDrill = {
          kind: "town+cat" as const,
          townId,
          categoryId: expandedId as CategoryId,
        };

        // Invalidar queries anteriores antes de actualizar el drill
        if (drill?.kind === "town+cat") {
          queryClient.invalidateQueries({
            queryKey: ["drilldown-details"],
          });
        }

        setDrill(newDrill);
      }
    },
    [expandedId, drill, queryClient]
  );

  const handleClose = useCallback(() => {
    setExpandedId(null);
    setDrill(null);
  }, []);

  // Memoizar level2Data para mejor tracking de dependencias
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

  // Remonta el grid si cambian exp/drill/granularidad/período
  const gridKey = useMemo(() => {
    const base = `g=${calculatedGranularity}|end=${currentPeriod.end}|exp=${
      expandedId ?? ""
    }`;
    if (drill?.kind === "town+cat")
      return `${base}|town=${drill.townId}|cat=${drill.categoryId}`;
    if (drill?.kind === "category") return `${base}|cat=${drill.categoryId}`;
    return base;
  }, [calculatedGranularity, currentPeriod.end, expandedId, drill]);

  return {
    expandedId,
    catId,
    drill,
    level2Data,
    gridKey,
    handleOpen,
    handleSliceClick,
    handleClose,
  };
}
