/**
 * Componente de drilldown expandido para categorías (CATEGORY-FIRST)
 *
 * NIVEL 1: Categoría → Pueblos (usando pattern *.<categoriaRaw>)
 * NIVEL 2: Categoría+Pueblo → Subcategorías (usando pattern <puebloRaw>.<categoriaRaw>)
 *
 * Navegación reactiva: Nivel 2 aparece DEBAJO de Nivel 1 (no reemplaza)
 *
 * Arquitectura refactorizada:
 * - CategoryHeader: Header reutilizable con back/close
 * - CategoryEmptyState: Estados vacío/error/loading
 * - useCategoryData: Hook transformación donut + line series
 * - useCategoryNavigation: Hook navegación nivel 1 ↔ 2 + scroll
 * - CategoryLevel2Panel: Renderizado condicional nivel 2
 */

"use client";

import ChartPair from "@/components/common/ChartPair";
import ChartPairSkeleton from "@/components/skeletons/ChartPairSkeleton";
import {
  CATEGORY_META,
  CHATBOT_CATEGORY_TOKENS,
} from "@/lib/taxonomy/categories";
import {
  CHATBOT_TOWN_TOKENS,
  TOWN_META,
  type TownId,
} from "@/lib/taxonomy/towns";
import { useLevel1Drilldown } from "../../hooks/useLevel1Drilldown";
import { CategoryEmptyState, CategoryErrorState } from "./CategoryEmptyState";
import type { CategoryExpandedCardProps } from "./CategoryExpandedCard.types";
import { CategoryHeader } from "./CategoryHeader";
import { CategoryLevel2Panel } from "./CategoryLevel2Panel";
import { useCategoryData } from "./useCategoryData";
import { useCategoryNavigation } from "./useCategoryNavigation";

export default function CategoryExpandedCard({
  categoryId,
  granularity,
  startDate,
  endDate,
  onClose,
  onTownClick,
  onScrollToLevel1,
}: CategoryExpandedCardProps) {
  const categoryMeta = CATEGORY_META[categoryId];
  const categoryLabel = categoryMeta?.label || categoryId;
  const categoryIcon = categoryMeta?.iconSrc;
  const categoryRaw = CHATBOT_CATEGORY_TOKENS[categoryId];

  // Hook: Navegación nivel 1 ↔ 2
  const navigation = useCategoryNavigation({
    granularity,
    onScrollToLevel1,
    onTownClick,
  });

  // Hook: Fetch datos Nivel 1
  const {
    data: level1Data,
    isLoading,
    isError,
    error,
  } = useLevel1Drilldown({
    scopeType: "category",
    scopeId: categoryId,
    granularity,
    startDate,
    endDate,
    db: "huelva",
    sumStrategy: "sum",
    debug: false,
  });

  // Hook: Transformar datos a formato ChartPair
  const { donutData, lineSeriesData, lineSeriesPrev, totalInteractions } =
    useCategoryData({
      level1Data: level1Data ?? null,
      granularity,
      startDate,
      endDate,
    });

  // Subtítulo dinámico
  const subtitle = navigation.selectedTownId
    ? `${categoryLabel} › ${
        TOWN_META[navigation.selectedTownId]?.label
      } • Análisis de subcategorías`
    : `Análisis por pueblos • ${totalInteractions.toLocaleString()} interacciones totales`;

  // Handler: Click en donut slice
  const handleTownClick = (label: string) => {
    if (!level1Data) return;

    const slice = level1Data.donutData.find((s) => s.label === label);
    if (!slice) return;

    // "Otros" no es clickeable en nivel 1
    if (slice.id === "otros") return;

    // Pueblo normal
    const townId = slice.id as TownId;
    const townRaw = CHATBOT_TOWN_TOKENS[townId];
    navigation.handleTownSelect(townId, townRaw);
  };

  // Estados de error/empty
  if (isError) {
    return (
      <CategoryErrorState errorMessage={error?.message} onClose={onClose} />
    );
  }

  // Empty state solo cuando NO está cargando y no hay datos
  if (!isLoading && (!donutData || donutData.length === 0)) {
    return (
      <CategoryEmptyState
        title={categoryLabel}
        subtitle={subtitle}
        imgSrc={categoryIcon}
        onClose={onClose}
      />
    );
  }

  // Estado principal: Nivel 1 + Nivel 2 condicional
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-[#fff7ed] dark:bg-[#0c1116] p-3 shadow-sm w-full">
      <CategoryHeader
        title={categoryLabel}
        subtitle={isLoading ? "Cargando datos..." : subtitle}
        imgSrc={categoryIcon}
        onClose={onClose}
        onBack={
          navigation.selectedTownId ? navigation.handleBackToLevel1 : undefined
        }
      />

      {isLoading ? (
        <ChartPairSkeleton
          chartHeight={320}
          donutHeight={180}
          legendItems={6}
          showActionPill={false}
        />
      ) : (
        <ChartPair
          mode="line"
          series={{
            current: lineSeriesData,
            previous: lineSeriesPrev,
          }}
          donutData={donutData}
          deltaPct={null}
          onDonutSlice={handleTownClick}
          donutCenterLabel={`${totalInteractions.toLocaleString()} Interacciones`}
          showActivityButton={false}
          granularity={granularity}
          className=""
        />
      )}

      <CategoryLevel2Panel
        categoryId={categoryId}
        categoryRaw={categoryRaw}
        selectedTownId={navigation.selectedTownId}
        selectedTownRaw={navigation.selectedTownRaw}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        level2Ref={navigation.level2Ref}
        onBack={navigation.handleBackToLevel1}
      />
    </div>
  );
}
