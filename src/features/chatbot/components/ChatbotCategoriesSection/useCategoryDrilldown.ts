import type { CategoryId } from "@/lib/taxonomy/categories";
import { useRef, useState } from "react";

export function useCategoryDrilldown() {
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryId | null>(null);

  const drilldownRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId as CategoryId);

    // Scroll automático usando requestAnimationFrame para mejor performance
    requestAnimationFrame(() => {
      drilldownRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    });
  };

  const handleBackToCategories = () => {
    setSelectedCategoryId(null);
  };

  const handleScrollToLevel1 = () => {
    drilldownRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return {
    selectedCategoryId,
    drilldownRef,
    handleCategoryClick,
    handleBackToCategories,
    handleScrollToLevel1,
  };
}
