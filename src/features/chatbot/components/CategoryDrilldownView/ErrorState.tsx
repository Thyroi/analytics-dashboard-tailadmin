interface ErrorStateProps {
  categoryLabel: string;
  errorMessage: string;
  onBack?: () => void;
}

export function ErrorState({
  categoryLabel,
  errorMessage,
  onBack,
}: ErrorStateProps) {
  return (
    <div className="max-w-[1560px] mx-auto w-full px-4">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Error al cargar datos de {categoryLabel}
            </h3>
            <p className="text-red-600 dark:text-red-300">{errorMessage}</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Volver
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
