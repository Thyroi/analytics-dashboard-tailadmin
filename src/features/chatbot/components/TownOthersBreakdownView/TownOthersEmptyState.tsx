interface TownOthersEmptyStateProps {
  townLabel: string;
  onBack?: () => void;
}

export default function TownOthersEmptyState({
  townLabel,
  onBack,
}: TownOthersEmptyStateProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {townLabel} → Otros
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No hay datos de claves sin mapear
          </p>
        </div>
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
      </div>
    </div>
  );
}
