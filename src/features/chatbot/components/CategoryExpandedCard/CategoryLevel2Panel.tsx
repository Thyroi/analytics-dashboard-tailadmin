import type { CategoryId } from "@/lib/taxonomy/categories";
import type { WindowGranularity } from "@/lib/types";
import CategoryTownSubcatDrilldownView from "../CategoryTownSubcatDrilldownView";
import type { CategoryDrilldownTownId } from "./CategoryExpandedCard.types";

type CategoryLevel2PanelProps = {
  categoryId: CategoryId;
  categoryRaw: string;
  selectedTownId: CategoryDrilldownTownId | null;
  selectedTownRaw: string | null;
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
 */
export function CategoryLevel2Panel({
  categoryId,
  categoryRaw,
  selectedTownId,
  selectedTownRaw,
  granularity,
  startDate,
  endDate,
  level2Ref,
  onBack,
}: CategoryLevel2PanelProps) {
  // No renderizar nada si no hay nivel 2 activo
  if (!selectedTownId) {
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
    </div>
  );
}
