/**
 * Pills section for selected pages
 */

import { XMarkIcon } from "@heroicons/react/24/outline";

interface SelectedPillsProps {
  selectedPaths: string[];
  pillColors: Record<string, string>;
  colorForPath: (path: string) => string;
  onPillRemove: (path: string) => void;
}

export function SelectedPills({
  selectedPaths,
  pillColors,
  colorForPath,
  onPillRemove,
}: SelectedPillsProps) {
  if (selectedPaths.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Páginas seleccionadas ({selectedPaths.length}/8):
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedPaths.map((path) => {
          const label = path.split("/").filter(Boolean).pop() || path;
          const color = pillColors[path] || colorForPath(path);

          return (
            <div
              key={path}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: color }}
            >
              <span className="truncate max-w-32" title={label}>
                {decodeURIComponent(label)}
              </span>
              <button
                onClick={() => onPillRemove(path)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                aria-label={`Quitar ${label}`}
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
