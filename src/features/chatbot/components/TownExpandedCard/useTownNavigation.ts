import type { CategoryId } from "@/lib/taxonomy/categories";
import type { WindowGranularity } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

type UseTownNavigationParams = {
  granularity: WindowGranularity;
  onScrollToLevel1?: () => void;
  onSelectCategory?: (categoryId: CategoryId) => void;
};

type UseTownNavigationResult = {
  selectedCategoryId: CategoryId | null;
  selectedCategoryRaw: string | null;
  isOthersView: boolean;
  level2Ref: React.RefObject<HTMLDivElement | null>;
  handleCategorySelect: (categoryId: CategoryId, categoryRaw: string) => void;
  handleOthersSelect: () => void;
  handleBackToLevel1: () => void;
};

/**
 * Hook que maneja la navegación entre Nivel 1 (categorías) y Nivel 2 (subcategorías/otros)
 * - Gestiona estado de categoría seleccionada
 * - Gestiona vista "Otros"
 * - Auto-scroll al nivel 2
 * - Reset cuando cambia la granularidad
 */
export function useTownNavigation({
  granularity,
  onScrollToLevel1,
  onSelectCategory,
}: UseTownNavigationParams): UseTownNavigationResult {
  const level2Ref = useRef<HTMLDivElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryId | null>(null);
  const [selectedCategoryRaw, setSelectedCategoryRaw] = useState<string | null>(
    null
  );
  const [isOthersView, setIsOthersView] = useState(false);

  // Cerrar nivel 2 cuando cambia la granularidad
  useEffect(() => {
    const wasLevel2Open = selectedCategoryId !== null || isOthersView;
    setSelectedCategoryId(null);
    setSelectedCategoryRaw(null);
    setIsOthersView(false);

    if (wasLevel2Open && onScrollToLevel1) {
      setTimeout(() => {
        onScrollToLevel1();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity]);

  const handleCategorySelect = (
    categoryId: CategoryId,
    categoryRaw: string
  ) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryRaw(categoryRaw);
    setIsOthersView(false);

    // Scroll al nivel 2
    setTimeout(() => {
      level2Ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    // Callback externo
    if (onSelectCategory) {
      onSelectCategory(categoryId);
    }
  };

  const handleOthersSelect = () => {
    setIsOthersView(true);
    setSelectedCategoryId(null);
    setSelectedCategoryRaw(null);

    // Scroll al nivel 2
    setTimeout(() => {
      level2Ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleBackToLevel1 = () => {
    setSelectedCategoryId(null);
    setSelectedCategoryRaw(null);
    setIsOthersView(false);
  };

  return {
    selectedCategoryId,
    selectedCategoryRaw,
    isOthersView,
    level2Ref,
    handleCategorySelect,
    handleOthersSelect,
    handleBackToLevel1,
  };
}
