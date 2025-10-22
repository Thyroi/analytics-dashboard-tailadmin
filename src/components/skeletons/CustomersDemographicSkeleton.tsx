"use client";

type Props = { height?: number; rows?: number };

export default function CustomersDemographicSkeleton({
  height = 260,
  rows = 6,
}: Props) {
  return (
    <div
      className="
        card rounded-2xl shadow-sm
        border border-gray-200 dark:border-white/10
        bg-white dark:bg-gray-900
        animate-pulse
      "
      aria-busy="true"
      aria-live="polite"
    >
      {/* Header */}
      <div
        className="
          card-header flex items-center justify-between
          border-b border-gray-100 dark:border-white/10
        "
      >
        <div>
          <div className="h-4 w-48 rounded bg-gray-200/70 dark:bg-white/10" />
          <div className="mt-2 h-3 w-64 rounded bg-gray-200/60 dark:bg-white/10" />
        </div>
        <div
          className="
            h-10 w-56 rounded-lg
            border border-gray-200 dark:border-white/10
            bg-gray-100 dark:bg-gray-800
          "
        />
      </div>

      <div className="card-body">
        {/* Mapa (placeholder) */}
        <div
          className="
            relative mb-6 w-full overflow-hidden rounded-xl
            bg-gray-100 dark:bg-gray-700
          "
          style={{ height }}
        >
          {/* shimmer light */}
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
          {/* shimmer dark */}
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

        {/* Lista (placeholder filas) */}
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-5 w-8 rounded bg-gray-200/70 dark:bg-white/10" />
              <div className="flex-1">
                <div className="h-3 w-40 rounded bg-gray-200/70 dark:bg-white/10" />
                <div className="mt-2 h-2 w-24 rounded bg-gray-200/60 dark:bg-white/10" />
              </div>
              <div className="h-2 w-32 rounded bg-gray-200/60 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
