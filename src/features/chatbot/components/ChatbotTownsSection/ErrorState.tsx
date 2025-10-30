type ErrorStateProps = {
  error: Error | null;
  onRetry: () => void;
};

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
      <p className="text-red-700 dark:text-red-300 mb-4">
        Error cargando datos de pueblos: {error?.message || "Error desconocido"}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
