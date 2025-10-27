/**
 * Componente de drilldown expandido para categorías (CATEGORY-FIRST)
 *
 * NIVEL 1: Categoría → Pueblos (usando pattern root.<categoriaRaw>.*)
 * NIVEL 2: Categoría+Pueblo → Subcategorías (usando pattern root.<categoriaRaw>.<puebloRaw>.*)
 *
 * Navegación reactiva: Nivel 2 aparece DEBAJO de Nivel 1 (no reemplaza)
 */

"use client";

import ChartPair from "@/components/common/ChartPair";
import { OTHERS_ID } from "@/lib/services/chatbot/partition";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_META } from "@/lib/taxonomy/categories";
import { TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, WindowGranularity } from "@/lib/types";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useCategoryTownBreakdown } from "../hooks/useCategoryTownBreakdown";
import CategoryOthersBreakdownView from "./CategoryOthersBreakdownView";
import CategoryTownSubcatDrilldownView from "./CategoryTownSubcatDrilldownView";

type Props = {
  categoryId: CategoryId;
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  onClose: () => void;
  onTownClick?: (townId: TownId) => void;
};

function Header({
  title,
  subtitle,
  imgSrc,
  onClose,
  onBack,
}: {
  title: string;
  subtitle: string;
  imgSrc?: string;
  onClose: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Volver"
          >
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
        )}
        {imgSrc && (
          <div className="flex-shrink-0">
            <Image
              src={imgSrc}
              alt={title}
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Cerrar"
      >
        <svg
          className="w-5 h-5 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export default function CategoryExpandedCard({
  categoryId,
  granularity,
  startDate,
  endDate,
  onClose,
  onTownClick,
}: Props) {
  const categoryMeta = CATEGORY_META[categoryId];
  const categoryLabel = categoryMeta?.label || categoryId;
  const categoryIcon = categoryMeta?.iconSrc;

  // Ref para scroll al nivel 2
  const level2Ref = useRef<HTMLDivElement>(null);

  // Estado para navegación Nivel 1 <-> Nivel 2
  const [selectedTownId, setSelectedTownId] = useState<TownId | null>(null);
  const [selectedTownRaw, setSelectedTownRaw] = useState<string | null>(null); // Token raw del pueblo
  const [isOthersView, setIsOthersView] = useState(false); // Nuevo estado para vista "Otros"

  // NIVEL 1: Datos de towns por categoría (category-first)
  const { data, isLoading, isError, error } = useCategoryTownBreakdown({
    categoryId,
    startISO: startDate,
    endISO: endDate,
    windowGranularity: granularity,
    enabled: true,
  });

  // Transformar datos Nivel 1 (towns) a formato ChartPair
  const { donutData, lineSeriesData, lineSeriesPrev, totalInteractions } =
    useMemo(() => {
      const towns = data?.towns || [];

      if (!towns || towns.length === 0) {
        return {
          donutData: [],
          lineSeriesData: [],
          lineSeriesPrev: [],
          totalInteractions: 0,
        };
      }

      // Donut: participación por town
      const donut: DonutDatum[] = towns
        .filter((town) => town.currentTotal > 0)
        .map((town) => ({
          label:
            town.townId !== OTHERS_ID
              ? TOWN_META[town.townId as TownId]?.label || town.label
              : town.label,
          value: town.currentTotal,
          color: undefined,
        }));

      // Line series: usar series agregadas por día retornadas por el servicio
      const lineSeries = data?.series?.current ?? [];
      const lineSeriesPrevious = data?.series?.previous ?? [];

      const total = towns.reduce((sum, town) => sum + town.currentTotal, 0);

      return {
        donutData: donut,
        lineSeriesData: lineSeries,
        lineSeriesPrev: lineSeriesPrevious,
        totalInteractions: total,
      };
    }, [data?.towns, data?.series]);

  // Subtítulo dinámico
  const subtitle = selectedTownId
    ? `${categoryLabel} › ${TOWN_META[selectedTownId]?.label} • Análisis de subcategorías`
    : `Análisis por pueblos • ${totalInteractions.toLocaleString()} interacciones totales`;

  const handleTownClick = (label: string) => {
    if (!data?.towns) return;

    // Buscar townId por label
    const town = data.towns.find((t) =>
      t.townId !== OTHERS_ID
        ? (TOWN_META[t.townId as TownId]?.label || t.label) === label
        : t.label === label
    );

    if (!town) return;

    // Si es "Otros", activar vista especial
    if (town.townId === OTHERS_ID) {
      setIsOthersView(true);
      setSelectedTownId(null);
      setSelectedTownRaw(null);

      // Scroll al nivel 2 (Otros)
      setTimeout(() => {
        level2Ref.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

      return;
    }

    // Si es un pueblo normal, obtener el token raw más frecuente
    const townId = town.townId as TownId;
    const rawSegments = data?.townRawSegmentsById?.[townId];
    let representativeRaw: string | null = null;

    if (rawSegments) {
      // Encontrar el segmento raw con mayor frecuencia
      const entries = Object.entries(rawSegments);
      if (entries.length > 0) {
        const [topRaw] = entries.sort((a, b) => b[1] - a[1])[0];
        representativeRaw = topRaw;
      }
    }

    setSelectedTownId(townId);
    setSelectedTownRaw(representativeRaw);
    setIsOthersView(false);

    // Scroll al nivel 2 después de un breve delay
    setTimeout(() => {
      level2Ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    // También llamar al callback externo si existe
    if (onTownClick) {
      onTownClick(townId);
    }
  };

  // Handler para volver de Nivel 2 a Nivel 1
  const handleBackToLevel1 = () => {
    setSelectedTownId(null);
    setSelectedTownRaw(null);
    setIsOthersView(false);
  };

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 shadow-sm w-full">
        <Header
          title="Error cargando datos"
          subtitle={error?.message || "Error desconocido"}
          onClose={onClose}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-[#fff7ed] dark:bg-[#0c1116] p-3 shadow-sm w-full">
        <Header
          title={categoryLabel}
          subtitle="Cargando datos..."
          imgSrc={categoryIcon}
          onClose={onClose}
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data?.towns || data.towns.length === 0 || totalInteractions === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-[#fff7ed] dark:bg-[#0c1116] p-3 shadow-sm w-full">
        <Header
          title={categoryLabel}
          subtitle={subtitle}
          imgSrc={categoryIcon}
          onClose={onClose}
        />
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-center">
            No hay datos de pueblos para esta categoría en el período
            seleccionado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-[#fff7ed] dark:bg-[#0c1116] p-3 shadow-sm w-full">
      <Header
        title={categoryLabel}
        subtitle={subtitle}
        imgSrc={categoryIcon}
        onClose={onClose}
        onBack={selectedTownId || isOthersView ? handleBackToLevel1 : undefined}
      />

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

      {/* NIVEL 2: Subcategorías (aparece DEBAJO cuando hay town seleccionado) */}
      {selectedTownId && (
        <div
          ref={level2Ref}
          className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          <CategoryTownSubcatDrilldownView
            categoryId={categoryId}
            townId={selectedTownId}
            townRaw={selectedTownRaw}
            granularity={granularity}
            startDate={startDate}
            endDate={endDate}
            onBack={handleBackToLevel1}
          />
        </div>
      )}

      {/* NIVEL 2: Vista "Otros" (claves sin mapear) */}
      {isOthersView && data?.othersBreakdown && (
        <div
          ref={level2Ref}
          className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          <CategoryOthersBreakdownView
            categoryId={categoryId}
            othersBreakdown={data.othersBreakdown.current}
            granularity={granularity}
            startDate={startDate}
            endDate={endDate}
            onBack={handleBackToLevel1}
          />
        </div>
      )}
    </div>
  );
}
