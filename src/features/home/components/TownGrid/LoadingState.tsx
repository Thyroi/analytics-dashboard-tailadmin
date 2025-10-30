import { GRID_CLASSES, SKELETON_COUNT, SKELETON_FIELDS_COUNT } from "./constants";

export function LoadingState() {
  return (
    <div className={GRID_CLASSES}>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div
          key={i}
          className="border rounded-lg p-4 bg-gray-100 dark:bg-gray-700 animate-pulse"
        >
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
          <div className="space-y-2">
            {Array.from({ length: SKELETON_FIELDS_COUNT }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-gray-300 dark:bg-gray-600 rounded"
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
