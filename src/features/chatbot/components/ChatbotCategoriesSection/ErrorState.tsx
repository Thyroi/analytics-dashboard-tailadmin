type ErrorStateProps = {
  error: Error | null;
  onRetry: () => void;
};

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-red-600 dark:text-red-400 mb-2">
        Error al cargar categorías
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {error?.message || "Error desconocido"}
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
