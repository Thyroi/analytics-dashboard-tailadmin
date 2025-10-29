import type { CategoryHeaderProps } from "./CategoryExpandedCard.types";
import { CategoryHeader } from "./CategoryHeader";

type EmptyStateProps = Pick<
  CategoryHeaderProps,
  "title" | "subtitle" | "imgSrc" | "onClose"
>;

type ErrorStateProps = {
  errorMessage?: string;
  onClose: () => void;
};

/**
 * Estado de error para CategoryExpandedCard
 */
export function CategoryErrorState({ errorMessage, onClose }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 shadow-sm w-full">
      <CategoryHeader
        title="Error cargando datos"
        subtitle={errorMessage || "Error desconocido"}
        onClose={onClose}
      />
    </div>
  );
}

/**
 * Estado vacío para CategoryExpandedCard (sin datos)
 */
export function CategoryEmptyState({
  title,
  subtitle,
  imgSrc,
  onClose,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-[#fff7ed] dark:bg-[#0c1116] p-3 shadow-sm w-full">
      <CategoryHeader
        title={title}
        subtitle={subtitle}
        imgSrc={imgSrc}
        onClose={onClose}
      />
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <svg
          className="w-16 h-16 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-center">
          No hay datos de pueblos para esta categoría en el período seleccionado
        </p>
      </div>
    </div>
  );
}
