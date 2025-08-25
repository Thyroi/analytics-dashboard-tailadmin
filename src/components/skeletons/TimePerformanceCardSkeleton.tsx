// src/components/skeletons/TimePerformanceCardSkeleton.tsx
"use client";

export default function TimePerformanceCardSkeleton({
  height = 260,
  className = "",
}: { height?: number; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#14181e] ${className}`}
      aria-busy="true"
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
        <div className="h-4 w-40 rounded bg-gray-200 dark:bg-white/10" />
        <div className="flex gap-2">
          <div className="h-7 w-16 rounded-md bg-gray-200 dark:bg-white/10" />
          <div className="h-7 w-20 rounded-md bg-gray-200 dark:bg-white/10" />
          <div className="h-7 w-16 rounded-md bg-gray-200 dark:bg-white/10" />
        </div>
      </div>

      {/* kpis */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-gray-200 dark:bg-white/10" />
          <div className="h-6 w-28 rounded bg-gray-200 dark:bg-white/10" />
        </div>
        <div className="hidden md:flex items-center gap-6">
          {[1, 2, 3].map((k) => (
            <div key={k} className="space-y-2">
              <div className="h-3 w-14 rounded bg-gray-200 dark:bg-white/10" />
              <div className="h-5 w-16 rounded bg-gray-200 dark:bg-white/10" />
              <div className="h-2 w-20 rounded bg-gray-200 dark:bg-white/10" />
            </div>
          ))}
        </div>
        <div className="hidden lg:block h-7 w-56 rounded-lg bg-gray-200 dark:bg-white/10" />
      </div>

      {/* chart */}
      <div className="px-3 pb-4">
        <div
          className="relative w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-[#0f1318]"
          style={{ height }}
        >
          <div
            className="absolute inset-0 translate-x-[-100%] animate-[dash-shimmer_1.4s_infinite]"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.45) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
