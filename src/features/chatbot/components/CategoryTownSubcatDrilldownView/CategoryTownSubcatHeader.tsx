import type { CategoryTownSubcatHeaderProps } from "./CategoryTownSubcatDrilldownView.types";

export default function CategoryTownSubcatHeader({
  categoryLabel,
  townLabel,
  totalInteractions,
  onBack,
}: CategoryTownSubcatHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {categoryLabel} › {townLabel}
        </h3>
        {totalInteractions !== undefined && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Subcategorías • {totalInteractions.toLocaleString()} interacciones
          </p>
        )}
      </div>
      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1"
      >
        <svg
          className="w-4 h-4"
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
        Volver
      </button>
    </div>
  );
}
