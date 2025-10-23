/**
 * Loading skeleton for table
 */

export function TableSkeleton() {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
            </div>
            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
