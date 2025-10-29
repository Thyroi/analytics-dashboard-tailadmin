/**
 * Componente de drilldown expandido para towns (TOWN-FIRST)
 *
 * NIVEL 1: Town → Categorías (usando pattern root.<townId>.*)
 * NIVEL 2: Town+Categoría → Subcategorías (usando pattern root.<townId>.<categoriaRaw>.*)
 *
 * Navegación reactiva: Nivel 2 aparece DEBAJO de Nivel 1 (no reemplaza)
 *
 * Arquitectura refactorizada:
 * - TownHeader: Header reutilizable con back/close
 * - TownEmptyState: Estados vacío/error
 * - useTownData: Hook transformación donut + line series
 * - useTownNavigation: Hook navegación nivel 1 ↔ 2 + scroll
 * - TownLevel2Panel: Renderizado condicional nivel 2
 */

"use client";

import ChartPair from "@/components/common/ChartPair";
import ChartPairSkeleton from "@/components/skeletons/ChartPairSkeleton";
import {
  CATEGORY_META,
  CHATBOT_CATEGORY_TOKENS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import {
  CHATBOT_TOWN_TOKENS,
  TOWN_META,
  type TownId,
} from "@/lib/taxonomy/towns";
import { useLevel1Drilldown } from "../../hooks/useLevel1Drilldown";
import { TownEmptyState, TownErrorState } from "./TownEmptyState";
import type { TownExpandedCardProps } from "./TownExpandedCard.types";
import { TownHeader } from "./TownHeader";
import { TownLevel2Panel } from "./TownLevel2Panel";
import { useTownData } from "./useTownData";
import { useTownNavigation } from "./useTownNavigation";

export default function TownExpandedCard({
  townId,
  granularity,
  startDate,
  endDate,
  onClose,
  onSelectCategory,
  onScrollToLevel1,
}: TownExpandedCardProps) {
  const townMeta = TOWN_META[townId as TownId];
  const townLabel = townMeta?.label || townId;
  const townIcon = townMeta?.iconSrc;
  const townRaw = CHATBOT_TOWN_TOKENS[townId as TownId];

  // Hook: Navegación nivel 1 ↔ 2
  const navigation = useTownNavigation({
    granularity,
    onScrollToLevel1,
    onSelectCategory,
  });

  // Hook: Fetch datos Nivel 1
  const {
    data: level1Data,
    isLoading,
    isError,
    error,
  } = useLevel1Drilldown({
    scopeType: "town",
    scopeId: townId,
    granularity,
    startDate,
    endDate,
    db: "project_huelva",
    sumStrategy: "sum",
    debug: false,
  });

  // Hook: Transformar datos a formato ChartPair
  const { donutData, lineSeriesData, lineSeriesPrev, totalInteractions } =
    useTownData({
      level1Data: level1Data ?? null,
      granularity,
      startDate,
      endDate,
    });

  // Subtítulo dinámico
  const subtitle = navigation.selectedCategoryId
    ? `${townLabel} › ${
        CATEGORY_META[navigation.selectedCategoryId]?.label
      } • Análisis de subcategorías`
    : `Análisis por categorías • ${totalInteractions.toLocaleString()} interacciones totales`;

  // Handler: Click en donut slice
  const handleCategoryClick = (label: string) => {
    if (!level1Data) return;

    const slice = level1Data.donutData.find((s) => s.label === label);
    if (!slice) return;

    // Vista "Otros"
    if (slice.id === "otros") {
      navigation.handleOthersSelect();
      return;
    }

    // Categoría normal
    const categoryId = slice.id as CategoryId;
    const categoryRaw = CHATBOT_CATEGORY_TOKENS[categoryId];
    navigation.handleCategorySelect(categoryId, categoryRaw);
  };

  // Estados de error/empty
  if (isError) {
    return <TownErrorState errorMessage={error?.message} onClose={onClose} />;
  }

  // Empty state solo cuando NO está cargando y no hay datos
  if (
    !isLoading &&
    (!level1Data?.donutData ||
      level1Data.donutData.length === 0 ||
      totalInteractions === 0)
  ) {
    return (
      <TownEmptyState
        title={townLabel}
        subtitle={subtitle}
        imgSrc={townIcon}
        onClose={onClose}
      />
    );
  }

  // Estado principal: Nivel 1 + Nivel 2 condicional
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-[#fff7ed] dark:bg-[#0c1116] p-3 shadow-sm w-full">
      <TownHeader
        title={townLabel}
        subtitle={isLoading ? "Cargando datos..." : subtitle}
        imgSrc={townIcon}
        onClose={onClose}
        onBack={
          navigation.selectedCategoryId || navigation.isOthersView
            ? navigation.handleBackToLevel1
            : undefined
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
          onDonutSlice={handleCategoryClick}
          donutCenterLabel={`${totalInteractions.toLocaleString()} Interacciones`}
          showActivityButton={false}
          granularity={granularity}
          className=""
        />
      )}

      <TownLevel2Panel
        townId={townId}
        townRaw={townRaw}
        selectedCategoryId={navigation.selectedCategoryId}
        selectedCategoryRaw={navigation.selectedCategoryRaw}
        isOthersView={navigation.isOthersView}
        otrosDetail={level1Data?.otrosDetail || []}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        level2Ref={navigation.level2Ref}
        onBack={navigation.handleBackToLevel1}
      />
    </div>
  );
}
