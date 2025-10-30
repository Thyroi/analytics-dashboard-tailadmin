interface CategoryInfoProps {
  categoryId: string;
  categoryLabel: string;
  granularity: string;
}

export function CategoryInfo({
  categoryId,
  categoryLabel,
  granularity,
}: CategoryInfoProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6">
      <h3 className="font-semibold mb-2">📊 Información de la Categoría</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">ID:</span>
          <div className="font-mono">{categoryId}</div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
          <div className="font-medium">{categoryLabel}</div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">
            Granularidad:
          </span>
          <div className="font-mono">{granularity}</div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Estado:</span>
          <div className="text-green-600 font-medium">Debug Mode</div>
        </div>
      </div>
    </div>
  );
}
