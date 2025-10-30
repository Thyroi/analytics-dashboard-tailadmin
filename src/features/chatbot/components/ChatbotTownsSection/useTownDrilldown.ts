import type { CategoryId } from "@/lib/taxonomy/categories";
import { useCallback, useRef, useState } from "react";

export function useTownDrilldown() {
  const [selectedTownId, setSelectedTownId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const drilldownRef = useRef<HTMLDivElement>(null);

  const handleTownClick = useCallback((townId: string) => {
    setSelectedTownId(townId);

    // Scroll automático usando requestAnimationFrame para mejor performance
    requestAnimationFrame(() => {
      drilldownRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });

      // Disparar eventos de resize de forma asíncrona después del scroll
      requestAnimationFrame(() => {
        try {
          window.dispatchEvent(new Event("resize"));
          window.dispatchEvent(new CustomEvent("chart-reflow"));
        } catch {
          // no-op en entornos donde window no existe
        }
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    setSelectedTownId(null);
    setSelectedCategoryId(null);
  }, []);

  const handleSelectCategory = useCallback((categoryId: CategoryId) => {
    setSelectedCategoryId(categoryId);
  }, []);

  const handleScrollToLevel1 = useCallback(() => {
    drilldownRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  return {
    selectedTownId,
    selectedCategoryId,
    drilldownRef,
    handleTownClick,
    handleClose,
    handleSelectCategory,
    handleScrollToLevel1,
  };
}
