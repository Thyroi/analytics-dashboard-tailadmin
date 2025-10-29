import type { OtrosDetailItem } from "@/lib/drilldown/level1/buildLevel1.types";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
import TownCategorySubcatDrilldownView from "../TownCategorySubcatDrilldownView";
import TownOthersBreakdownView from "../TownOthersBreakdownView";

type TownLevel2PanelProps = {
  townId: string;
  townRaw: string;
  selectedCategoryId: CategoryId | null;
  selectedCategoryRaw: string | null;
  isOthersView: boolean;
  otrosDetail: OtrosDetailItem[];
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  level2Ref: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
};

/**
 * Panel de Nivel 2 para TownExpandedCard
 * Renderiza condicionalmente:
 * - TownCategorySubcatDrilldownView (cuando hay categoría seleccionada)
 * - TownOthersBreakdownView (cuando isOthersView es true)
 */
export function TownLevel2Panel({
  townId,
  townRaw,
  selectedCategoryId,
  selectedCategoryRaw,
  isOthersView,
  otrosDetail,
  granularity,
  startDate,
  endDate,
  level2Ref,
  onBack,
}: TownLevel2PanelProps) {
  // No renderizar nada si no hay nivel 2 activo
  if (!selectedCategoryId && !isOthersView) {
    return null;
  }

  return (
    <div
      ref={level2Ref}
      className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
    >
      {selectedCategoryId && (
        <TownCategorySubcatDrilldownView
          townId={townId as TownId}
          categoryId={selectedCategoryId}
          townRaw={townRaw}
          categoryRaw={selectedCategoryRaw}
          startISO={startDate}
          endISO={endDate}
          windowGranularity={granularity}
          onBack={onBack}
        />
      )}

      {isOthersView && otrosDetail.length > 0 && (
        <TownOthersBreakdownView
          townId={townId as TownId}
          othersBreakdown={otrosDetail.map((o) => ({
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
          onBack={onBack}
        />
      )}
    </div>
  );
}
