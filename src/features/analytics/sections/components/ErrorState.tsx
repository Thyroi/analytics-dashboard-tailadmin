/**
 * Error state component
 */

interface ErrorStateProps {
  error: Error | unknown;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
      <div className="text-center">
        <div className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">
          Error al cargar datos comparativos
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error instanceof Error
            ? error.message
            : "Ha ocurrido un error inesperado al conectar con Google Analytics"}
        </p>
        <div className="space-y-2">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mr-2"
          >
            Reintentar
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Si el error persiste, revisa la consola del navegador para más
            detalles
          </p>
        </div>
      </div>
    </div>
  );
}
