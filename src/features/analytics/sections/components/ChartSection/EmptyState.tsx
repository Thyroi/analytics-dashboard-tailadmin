import { BarChart3 } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          Selecciona hasta 8 páginas en la tabla para comparar
        </p>
      </div>
    </div>
  );
}
