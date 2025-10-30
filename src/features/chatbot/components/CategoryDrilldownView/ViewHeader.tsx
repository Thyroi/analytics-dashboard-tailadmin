interface ViewHeaderProps {
  categoryLabel: string;
  totalInteractions: number;
  onBack?: () => void;
}

export function ViewHeader({
  categoryLabel,
  totalInteractions,
  onBack,
}: ViewHeaderProps) {
  return (
    <div className="px-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Volver"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {categoryLabel}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Análisis detallado por subcategorías •{" "}
                {totalInteractions.toLocaleString()} interacciones totales
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
