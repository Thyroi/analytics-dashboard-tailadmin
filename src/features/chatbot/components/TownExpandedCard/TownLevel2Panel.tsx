import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
import TownCategorySubcatDrilldownView from "../TownCategorySubcatDrilldownView";

type TownLevel2PanelProps = {
  townId: string;
  townRaw: string;
  selectedCategoryId: CategoryId | null;
  selectedCategoryRaw: string | null;
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
 */
export function TownLevel2Panel({
  townId,
  townRaw,
  selectedCategoryId,
  selectedCategoryRaw,
  granularity,
  startDate,
  endDate,
  level2Ref,
  onBack,
}: TownLevel2PanelProps) {
  // No renderizar nada si no hay nivel 2 activo
  if (!selectedCategoryId) {
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
    </div>
  );
}
