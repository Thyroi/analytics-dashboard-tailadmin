import CategoryTownSubcatHeader from "./CategoryTownSubcatHeader";

interface EmptyStateProps {
  categoryLabel: string;
  townLabel: string;
  onBack: () => void;
}

export function CategoryTownSubcatLoadingState({
  categoryLabel,
  townLabel,
  onBack,
}: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <CategoryTownSubcatHeader
        categoryLabel={categoryLabel}
        townLabel={townLabel}
        onBack={onBack}
      />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  onBack: () => void;
  error?: Error | null;
}

export function CategoryTownSubcatErrorState({
  onBack,
  error,
}: ErrorStateProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
          Error al cargar subcategorías
        </h3>
        <button
          onClick={onBack}
          className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        >
          ← Volver
        </button>
      </div>
      <p className="text-red-600 dark:text-red-300 text-sm">
        {error?.message || "Error desconocido"}
      </p>
    </div>
  );
}

export function CategoryTownSubcatEmptyDataState({
  categoryLabel,
  townLabel,
  onBack,
}: EmptyStateProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <CategoryTownSubcatHeader
        categoryLabel={categoryLabel}
        townLabel={townLabel}
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
