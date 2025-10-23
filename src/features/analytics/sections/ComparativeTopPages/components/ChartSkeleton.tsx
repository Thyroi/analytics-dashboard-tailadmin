/**
 * Enhanced skeleton for the chart section during loading
 */

export function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Chart container */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Chart title skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>

        {/* Chart area skeleton */}
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 relative overflow-hidden">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-gray-700/20 to-transparent transform -skew-x-12 animate-[shimmer_2s_infinite]"></div>

          {/* Y-axis labels */}
          <div className="absolute left-2 top-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>

          {/* Chart lines skeleton */}
          <div className="absolute inset-4">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Grid lines */}
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-gray-200 dark:text-gray-700"
                    opacity="0.3"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Sample chart lines */}
              <path
                d="M 20,160 Q 80,120 140,140 T 260,100 T 380,80"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-300 dark:text-blue-600"
                opacity="0.6"
              />
              <path
                d="M 20,180 Q 80,150 140,160 T 260,130 T 380,110"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-green-300 dark:text-green-600"
                opacity="0.6"
              />
            </svg>
          </div>
        </div>

        {/* X-axis labels skeleton */}
        <div className="flex justify-between px-4">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
