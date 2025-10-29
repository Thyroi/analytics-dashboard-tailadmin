import TownCategorySubcatHeader from "./TownCategorySubcatHeader";

interface EmptyStateProps {
  townLabel: string;
  categoryLabel: string;
  onBack: () => void;
}

export function TownCategorySubcatLoadingState({
  townLabel,
  categoryLabel,
  onBack,
}: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <TownCategorySubcatHeader
        townLabel={townLabel}
        categoryLabel={categoryLabel}
        onBack={onBack}
      />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );
}

export function TownCategorySubcatEmptyDataState({
  townLabel,
  categoryLabel,
  onBack,
}: EmptyStateProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <TownCategorySubcatHeader
        townLabel={townLabel}
        categoryLabel={categoryLabel}
        onBack={onBack}
      />
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400 mb-2">
          No hay subcategorías disponibles
        </div>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          No se encontraron datos para este período
        </p>
      </div>
    </div>
  );
}
