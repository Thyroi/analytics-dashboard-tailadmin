export function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-gray-600 dark:text-gray-400 mb-2">
        Sin datos disponibles
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-500">
        No se encontraron datos de categorías en el período seleccionado
      </div>
    </div>
  );
}
