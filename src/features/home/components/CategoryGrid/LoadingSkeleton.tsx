export function LoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          </div>
          <hr className="border-gray-200 dark:border-gray-600" />
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-10"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
