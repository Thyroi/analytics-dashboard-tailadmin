import type { OtrosDetailItem } from "@/lib/drilldown/level1/buildLevel1.types";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
import CategoryOthersBreakdownView from "../CategoryOthersBreakdownView";
import CategoryTownSubcatDrilldownView from "../CategoryTownSubcatDrilldownView";

type CategoryLevel2PanelProps = {
  categoryId: CategoryId;
  categoryRaw: string;
  selectedTownId: TownId | null;
  selectedTownRaw: string | null;
  isOthersView: boolean;
  otrosDetail: OtrosDetailItem[];
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  level2Ref: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
};

/**
 * Panel de Nivel 2 para CategoryExpandedCard
 * Renderiza condicionalmente:
 * - CategoryTownSubcatDrilldownView (cuando hay town seleccionado)
 * - CategoryOthersBreakdownView (cuando isOthersView es true)
 */
export function CategoryLevel2Panel({
  categoryId,
  categoryRaw,
  selectedTownId,
  selectedTownRaw,
  isOthersView,
  otrosDetail,
  granularity,
  startDate,
  endDate,
  level2Ref,
  onBack,
}: CategoryLevel2PanelProps) {
  // No renderizar nada si no hay nivel 2 activo
  if (!selectedTownId && !isOthersView) {
    return null;
  }

  return (
    <div
      ref={level2Ref}
      className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
    >
      {selectedTownId && (
        <CategoryTownSubcatDrilldownView
          categoryId={categoryId}
          townId={selectedTownId}
          categoryRaw={categoryRaw}
          townRaw={selectedTownRaw}
          granularity={granularity}
          startDate={startDate}
          endDate={endDate}
          onBack={onBack}
        />
      )}

      {isOthersView && otrosDetail.length > 0 && (
        <CategoryOthersBreakdownView
          categoryId={categoryId}
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
