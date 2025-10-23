/**
 * Empty state component for when the table has no data
 */

import { FileText, SearchX } from "lucide-react";

interface TableEmptyStateProps {
  hasSearchTerm?: boolean;
  searchTerm?: string;
}

export function TableEmptyState({
  hasSearchTerm,
  searchTerm,
}: TableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500">
        {hasSearchTerm ? (
          <SearchX className="w-full h-full" />
        ) : (
          <FileText className="w-full h-full" />
        )}
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {hasSearchTerm
          ? "No se encontraron resultados"
          : "No hay datos disponibles"}
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
        {hasSearchTerm ? (
          <>
            No encontramos páginas que coincidan con{" "}
            <span className="font-medium">&ldquo;{searchTerm}&rdquo;</span>.
            Intenta con otros términos de búsqueda.
          </>
        ) : (
          "No hay datos de páginas disponibles para el período seleccionado. Los datos pueden tardar hasta 24 horas en aparecer."
        )}
      </p>

      {hasSearchTerm && (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
