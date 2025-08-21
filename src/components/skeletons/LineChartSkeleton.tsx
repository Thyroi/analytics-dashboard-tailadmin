"use client";

type Props = { height?: number };

export default function LineChartSkeleton({ height = 200 }: Props) {
  return (
    <div
      className="
        card rounded-2xl shadow-sm
        border border-gray-200 dark:border-white/10
        bg-white dark:bg-[#14181e]
      "
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className="
          card-header border-b
          border-gray-100 dark:border-white/10
        "
      >
        <div className="animate-pulse">
          <div className="h-4 w-36 rounded bg-gray-200/70 dark:bg-white/10" />
          <div className="mt-2 h-3 w-48 rounded bg-gray-200/60 dark:bg-white/10" />
        </div>
      </div>

      <div className="card-body">
        <div
          className="
            relative w-full overflow-hidden rounded-xl
            bg-gray-100 dark:bg-[#0f1318]
          "
          style={{ height }}
        >
          {/* shimmer para light */}
          <div
            className="
              absolute inset-0 translate-x-[-100%]
              animate-[dash-shimmer_1.4s_infinite]
              block dark:hidden
            "
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
          {/* shimmer para dark (más sutil sobre #14181e) */}
          <div
            className="
              absolute inset-0 translate-x-[-100%]
              animate-[dash-shimmer_1.4s_infinite]
              hidden dark:block
            "
            style={{
              background:
                "linear-gradient(90deg, rgba(20,24,30,0) 0%, rgba(255,255,255,0.12) 50%, rgba(20,24,30,0) 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
