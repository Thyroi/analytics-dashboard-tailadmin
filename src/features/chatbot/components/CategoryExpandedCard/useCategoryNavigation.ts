import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

type UseCategoryNavigationParams = {
  granularity: WindowGranularity;
  onScrollToLevel1?: () => void;
  onTownClick?: (townId: TownId) => void;
};

type UseCategoryNavigationResult = {
  selectedTownId: TownId | null;
  selectedTownRaw: string | null;
  level2Ref: React.RefObject<HTMLDivElement | null>;
  handleTownSelect: (townId: TownId, townRaw: string) => void;
  handleBackToLevel1: () => void;
};

/**
 * Hook que maneja la navegación entre Nivel 1 (pueblos) y Nivel 2 (subcategorías/otros)
 * - Gestiona estado de town seleccionado
 * - Gestiona vista "Otros"
 * - Auto-scroll al nivel 2
 * - Reset cuando cambia la granularidad
 */
export function useCategoryNavigation({
  granularity,
  onScrollToLevel1,
  onTownClick,
}: UseCategoryNavigationParams): UseCategoryNavigationResult {
  const level2Ref = useRef<HTMLDivElement>(null);
  const [selectedTownId, setSelectedTownId] = useState<TownId | null>(null);
  const [selectedTownRaw, setSelectedTownRaw] = useState<string | null>(null);

  const scrollToLevel2 = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        level2Ref.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      });
    });
  };

  // Cerrar nivel 2 cuando cambia la granularidad
  useEffect(() => {
    const wasLevel2Open = selectedTownId !== null;
    setSelectedTownId(null);
    setSelectedTownRaw(null);

    if (wasLevel2Open && onScrollToLevel1) {
      setTimeout(() => {
        onScrollToLevel1();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity]);

  const handleTownSelect = (townId: TownId, townRaw: string) => {
    setSelectedTownId(townId);
    setSelectedTownRaw(townRaw);

    // Scroll al nivel 2
    setTimeout(() => {
      scrollToLevel2();
    }, 150);

    // Callback externo
    if (onTownClick) {
      onTownClick(townId);
    }
  };

  const handleBackToLevel1 = () => {
    setSelectedTownId(null);
    setSelectedTownRaw(null);
  };

  return {
    selectedTownId,
    selectedTownRaw,
    level2Ref,
    handleTownSelect,
    handleBackToLevel1,
  };
}
