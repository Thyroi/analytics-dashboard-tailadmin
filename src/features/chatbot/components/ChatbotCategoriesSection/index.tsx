/**
 * Componente para mostrar categorías de chatbot usando delta cards
 * Similar a SectorsByTagSection pero para datos de chatbot
 * Incluye sistema de drilldown basado en fechas reales del API
 */

"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import {
  useChatbotCategoryHandlers,
  useChatbotCategoryTotals,
} from "../../hooks/useChatbotCategoryTotals";
import CategoryExpandedCard from "../CategoryExpandedCard";
import TopCategoriesKPI from "../TopCategoriesKPI";
import { CategoryGrid } from "./CategoryGrid";
import { useCategoryDrilldown } from "./useCategoryDrilldown";

function ChatbotCategoriesSectionContent() {
  const {
    mode,
    granularity,
    startDate,
    endDate,
    setGranularity,
    setRange,
    clearRange,
    updatePickerDatesOnly,
    getCalculatedGranularity,
  } = useTagTimeframe();

  // Obtener handlers para invalidación/refetch
  const handlers = useChatbotCategoryHandlers();

  // Convertir fechas de manera segura
  let startDateStr: string | null = null;
  let endDateStr: string | null = null;

  try {
    startDateStr =
      startDate instanceof Date && !isNaN(startDate.getTime())
        ? startDate.toISOString().split("T")[0]
        : null;
    endDateStr =
      endDate instanceof Date && !isNaN(endDate.getTime())
        ? endDate.toISOString().split("T")[0]
        : null;
  } catch {
    startDateStr = null;
    endDateStr = null;
  }

  // Hook principal con React Query (sin useEffect)
  const effectiveGranularity = getCalculatedGranularity();

  const { categories, isLoading, isError, error, refetch } =
    useChatbotCategoryTotals({
      granularity: effectiveGranularity,
      startDate: startDateStr,
      endDate: endDateStr,
    });

  // Drilldown state management
  const {
    selectedCategoryId,
    drilldownRef,
    handleCategoryClick,
    handleBackToCategories,
    handleScrollToLevel1,
  } = useCategoryDrilldown();

  return (
    <section className="max-w-[1560px] mx-auto w-full">
      <StickyHeaderSection
        title="Categorías por Tags"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={(newGranularity) => {
          // NO cerrar drilldown - solo actualizar granularidad
          // El drilldown se refetcheará automáticamente con React Query
          setGranularity(newGranularity);
          handlers.onGranularityChange();
        }}
        onRangeChange={(start, end) => {
          setRange(start, end);
          handlers.onRangeChange();
        }}
        onClearRange={() => {
          clearRange();
          handlers.onClearRange();
        }}
        onPickerDatesUpdate={updatePickerDatesOnly}
      />

      {/* Top Categories KPI entre header y categorías */}
      <div className="px-4 mb-6">
        <TopCategoriesKPI
          categories={categories.slice(0, 8)}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      {/* Drilldown expandido como overlay */}
      {selectedCategoryId && (
        <div ref={drilldownRef} className="px-4 mb-6">
          <CategoryExpandedCard
            key={selectedCategoryId} // Forzar remontaje cuando cambia la categoría
            categoryId={selectedCategoryId}
            granularity={effectiveGranularity}
            startDate={startDateStr}
            endDate={endDateStr}
            onClose={handleBackToCategories}
            onScrollToLevel1={handleScrollToLevel1}
          />
        </div>
      )}

      {/* Grid de categorías siempre visible */}
      <div className="px-4">
        <CategoryGrid
          categories={categories}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          onCategoryClick={handleCategoryClick}
          selectedCategoryId={selectedCategoryId}
        />
      </div>
    </section>
  );
}

export default function ChatbotCategoriesSection() {
  return (
    <TagTimeProvider>
      <ChatbotCategoriesSectionContent />
    </TagTimeProvider>
  );
}
