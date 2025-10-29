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
  isOthersView: boolean;
  level2Ref: React.RefObject<HTMLDivElement | null>;
  handleTownSelect: (townId: TownId, townRaw: string) => void;
  handleOthersSelect: () => void;
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
  const [isOthersView, setIsOthersView] = useState(false);

  // Cerrar nivel 2 cuando cambia la granularidad
  useEffect(() => {
    const wasLevel2Open = selectedTownId !== null || isOthersView;
    setSelectedTownId(null);
    setSelectedTownRaw(null);
    setIsOthersView(false);

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
    setIsOthersView(false);

    // Scroll al nivel 2
    setTimeout(() => {
      level2Ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    // Callback externo
    if (onTownClick) {
      onTownClick(townId);
    }
  };

  const handleOthersSelect = () => {
    setIsOthersView(true);
    setSelectedTownId(null);
    setSelectedTownRaw(null);

    // Scroll al nivel 2
    setTimeout(() => {
      level2Ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleBackToLevel1 = () => {
    setSelectedTownId(null);
    setSelectedTownRaw(null);
    setIsOthersView(false);
  };

  return {
    selectedTownId,
    selectedTownRaw,
    isOthersView,
    level2Ref,
    handleTownSelect,
    handleOthersSelect,
    handleBackToLevel1,
  };
}
