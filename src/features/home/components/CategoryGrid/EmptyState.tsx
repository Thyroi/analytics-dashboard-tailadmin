export function EmptyState() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No hay datos de categorías
        </h3>
        <p className="text-gray-500">
          No se encontraron datos para el período seleccionado.
        </p>
      </div>
    </div>
  );
}
