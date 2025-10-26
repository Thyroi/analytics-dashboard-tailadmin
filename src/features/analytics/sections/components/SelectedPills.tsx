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
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedPaths.map((path, index) => {
          const label = path.split("/").filter(Boolean).pop() || path;
          const color = pillColors[path] || colorForPath(path);

          return (
            <div
              key={path}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 animate-in fade-in slide-in-from-left-2"
              style={{ 
                backgroundColor: color,
                animationDelay: `${index * 50}ms`,
                animationDuration: '300ms',
                animationFillMode: 'both'
              }}
            >
              <span className="truncate max-w-32" title={label}>
                {decodeURIComponent(label)}
              </span>
              <button
                onClick={() => onPillRemove(path)}
                className="hover:bg-white/30 hover:scale-110 rounded-full p-1 transition-all duration-150 ml-0.5"
                aria-label={`Quitar ${label}`}
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Páginas seleccionadas ({selectedPaths.length}/8)
      </div>
    </div>
  );
}
