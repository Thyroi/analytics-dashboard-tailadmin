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
import type { CategoryId } from "@/lib/taxonomy/categories";
import {
  CATEGORY_META,
  CHATBOT_CATEGORY_TOKENS,
} from "@/lib/taxonomy/categories";
import {
  CHATBOT_TOWN_TOKENS,
  TOWN_META,
  type TownId,
} from "@/lib/taxonomy/towns";
import type { DonutDatum, WindowGranularity } from "@/lib/types";
import { fillMissingDates } from "@/lib/utils/time/fillMissingDates";
import { computeRangesForSeries } from "@/lib/utils/time/timeWindows";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLevel1Drilldown } from "../hooks/useLevel1Drilldown";
import CategoryOthersBreakdownView from "./CategoryOthersBreakdownView";
import CategoryTownSubcatDrilldownView from "./CategoryTownSubcatDrilldownView";

type Props = {
  categoryId: CategoryId;
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  onClose: () => void;
  onTownClick?: (townId: TownId) => void;
  onScrollToLevel1?: () => void; // Callback para scroll controlado por el padre
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
  onScrollToLevel1,
}: Props) {
  const categoryMeta = CATEGORY_META[categoryId];
  const categoryLabel = categoryMeta?.label || categoryId;
  const categoryIcon = categoryMeta?.iconSrc;

  // Token RAW de la categoría para queries del chatbot (lookup directo, sin procesamiento)
  const categoryRaw = CHATBOT_CATEGORY_TOKENS[categoryId];

  // Ref para scroll al nivel 2
  const level2Ref = useRef<HTMLDivElement>(null);

  // Estado para navegación Nivel 1 <-> Nivel 2
  const [selectedTownId, setSelectedTownId] = useState<TownId | null>(null);
  const [selectedTownRaw, setSelectedTownRaw] = useState<string | null>(null); // Token raw del pueblo
  const [isOthersView, setIsOthersView] = useState(false); // Nuevo estado para vista "Otros"

  // Cerrar nivel 2 cuando cambia la granularidad
  useEffect(() => {
    // Capturar estado actual ANTES de cerrar
    const wasLevel2Open = selectedTownId !== null || isOthersView;

    // Cerrar nivel 2
    setSelectedTownId(null);
    setSelectedTownRaw(null);
    setIsOthersView(false);

    // Si había nivel 2 abierto, hacer scroll al drilldown (nivel 1)
    if (wasLevel2Open && onScrollToLevel1) {
      setTimeout(() => {
        onScrollToLevel1();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity]);

  // NIVEL 1: Datos de pueblos de la categoría usando Level 1 batching
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
    db: "project_huelva",
    sumStrategy: "sum",
    debug: false,
  });

  // Transformar datos Nivel 1 (donutData + seriesBySlice) a formato ChartPair
  const { donutData, lineSeriesData, lineSeriesPrev, totalInteractions } =
    useMemo(() => {
      if (!level1Data) {
        return {
          donutData: [],
          lineSeriesData: [],
          lineSeriesPrev: [],
          totalInteractions: 0,
        };
      }

      // Donut: participación por slice (town)
      const donut: DonutDatum[] = level1Data.donutData
        .filter((slice) => slice.value > 0)
        .map((slice) => ({
          label: slice.label,
          value: slice.value,
          color: undefined,
        }));

      // Line series CURRENT: usar series agregadas por slice
      const allSeriesCurrent = Object.values(level1Data.seriesBySlice).flat();
      const timeMapCurrent = new Map<string, number>();

      for (const point of allSeriesCurrent) {
        // Convertir YYYYMMDD → YYYY-MM-DD
        const dateLabel = point.time.replace(
          /(\d{4})(\d{2})(\d{2})/,
          "$1-$2-$3"
        );
        const current = timeMapCurrent.get(dateLabel) || 0;
        timeMapCurrent.set(dateLabel, current + point.value);
      }

      // Materializar serie completa: generar TODAS las fechas del rango
      let lineSeriesCurrent: Array<{ label: string; value: number }> = [];

      if (startDate && endDate) {
        // Convertir YYYYMMDD → YYYY-MM-DD
        const startISO = startDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
        const endISO = endDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");

        // Generar rango completo con fillMissingDates (reutiliza la lógica)
        lineSeriesCurrent = fillMissingDates(
          Array.from(timeMapCurrent.entries()).map(([label, value]) => ({
            label,
            value,
          })),
          granularity,
          startISO,
          endISO
        );
      } else {
        // Fallback: usar solo datos disponibles
        lineSeriesCurrent = Array.from(timeMapCurrent.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => a.label.localeCompare(b.label));
      }

      // Line series PREVIOUS: procesar level1DataPrevious si existe
      let lineSeriesPrevious: Array<{ label: string; value: number }> = [];

      if (startDate && endDate) {
        // Calcular rango previous usando computeRangesForSeries
        const startISO = startDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
        const endISO = endDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
        const ranges = computeRangesForSeries(granularity, startISO, endISO);

        if (level1Data.raw?.level1DataPrevious) {
          const prevData = level1Data.raw.level1DataPrevious;
          const timeMapPrev = new Map<string, number>();

          // Agregar todas las series del período previo
          for (const [, series] of Object.entries(prevData)) {
            for (const point of series) {
              // Convertir YYYYMMDD → YYYY-MM-DD
              const dateLabel = point.time.replace(
                /(\d{4})(\d{2})(\d{2})/,
                "$1-$2-$3"
              );
              const current = timeMapPrev.get(dateLabel) || 0;
              timeMapPrev.set(dateLabel, current + point.value);
            }
          }

          // Generar rango completo con fillMissingDates
          lineSeriesPrevious = fillMissingDates(
            Array.from(timeMapPrev.entries()).map(([label, value]) => ({
              label,
              value,
            })),
            granularity,
            ranges.previous.start,
            ranges.previous.end
          );
        } else {
          // Si no hay datos previous, crear serie vacía con el rango completo
          lineSeriesPrevious = fillMissingDates(
            [],
            granularity,
            ranges.previous.start,
            ranges.previous.end
          );
        }
      }

      return {
        donutData: donut,
        lineSeriesData: lineSeriesCurrent,
        lineSeriesPrev: lineSeriesPrevious,
        totalInteractions: level1Data.total,
      };
    }, [level1Data, startDate, endDate, granularity]);

  // Subtítulo dinámico
  const subtitle = selectedTownId
    ? `${categoryLabel} › ${TOWN_META[selectedTownId]?.label} • Análisis de subcategorías`
    : `Análisis por pueblos • ${totalInteractions.toLocaleString()} interacciones totales`;

  const handleTownClick = (label: string) => {
    if (!level1Data) return;

    // Buscar town por label en donutData
    const slice = level1Data.donutData.find((s) => s.label === label);
    if (!slice) return;

    // Si es "Otros", activar vista especial
    if (slice.id === "otros") {
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

    // Si es un pueblo normal, el id es el TownId canónico
    const townId = slice.id as TownId;
    setSelectedTownId(townId);
    // IMPORTANTE: usar token directo de taxonomía, no rawToken de las keys (que puede ser inconsistente)
    setSelectedTownRaw(CHATBOT_TOWN_TOKENS[townId]);
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
  if (
    !level1Data?.donutData ||
    level1Data.donutData.length === 0 ||
    totalInteractions === 0
  ) {
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
            categoryRaw={categoryRaw}
            townRaw={selectedTownRaw}
            granularity={granularity}
            startDate={startDate}
            endDate={endDate}
            onBack={handleBackToLevel1}
          />
        </div>
      )}

      {/* NIVEL 2: Vista "Otros" (claves sin mapear) */}
      {isOthersView &&
        level1Data?.otrosDetail &&
        level1Data.otrosDetail.length > 0 && (
          <div
            ref={level2Ref}
            className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <CategoryOthersBreakdownView
              categoryId={categoryId}
              othersBreakdown={level1Data.otrosDetail.map((o) => ({
                key: o.key,
                path: o.key.split("."),
                value: o.series.reduce((acc, p) => acc + p.value, 0),
                timePoints: o.series.map((p) => ({
                  time: p.time,
                  value: p.value,
                })),
              }))}
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
