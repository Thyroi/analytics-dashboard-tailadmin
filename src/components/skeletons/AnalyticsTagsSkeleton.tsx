"use client";

export default function AnalyticsTagsSkeleton() {
  return (
    <div
      className="
        rounded-2xl shadow-sm
        border border-gray-200 dark:border-white/10
        bg-white dark:bg-[#14181e]
        animate-pulse
      "
      aria-busy="true"
      aria-live="polite"
    >
      {/* Header */}
      <div
        className="
          flex items-center justify-between px-5 py-4
          border-b border-gray-100 dark:border-white/10
        "
      >
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-gray-200/70 dark:bg-white/10" />
          <div className="h-3 w-64 rounded bg-gray-200/60 dark:bg-white/10" />
        </div>

        <div className="flex items-center gap-2">
          <div
            className="
              h-8 w-56 rounded-lg
              border border-gray-200 dark:border-white/10
              bg-white/70 dark:bg-[#14181e]
            "
          />
          <div
            className="
              h-8 w-24 rounded-lg
              border border-gray-200 dark:border-white/10
              bg-white/70 dark:bg-[#14181e]
            "
          />
        </div>
      </div>

      {/* Cloud + Chips */}
      <div className="px-5 pt-4 pb-2">
        {/* Cloud area with shimmer */}
        <div
          className="
            relative rounded-xl px-4 py-6
            bg-gray-50 dark:bg-[#0f1318]
            border border-gray-100 dark:border-white/10
            overflow-hidden
          "
        >
          {/* shimmer light */}
          <div
            className="
              absolute inset-0 translate-x-[-100%]
              animate-[dash-shimmer_1.4s_infinite]
              pointer-events-none
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
              pointer-events-none
              hidden dark:block
            "
            style={{
              background:
                "linear-gradient(90deg, rgba(20,24,30,0) 0%, rgba(255,255,255,0.12) 50%, rgba(20,24,30,0) 100%)",
            }}
          />
          <div className="h-24 rounded bg-gray-100/60 dark:bg-white/[0.04]" />
        </div>

        {/* Chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[24, 28, 32, 40, 36].map((w, i) => (
            <div
              key={i}
              className="h-7 rounded-full bg-gray-200/70 dark:bg-white/10"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-5 pb-5">
        {/* Left card: checklist placeholder */}
        <div
          className="
            md:col-span-1 rounded-xl px-4 py-4
            border border-gray-100 dark:border-white/10
            bg-white/60 dark:bg-[#0f1318]
          "
        >
          <div className="h-4 w-40 rounded bg-gray-200/70 dark:bg-white/10 mb-4" />

          <ul className="space-y-4">
            {[1, 2, 3, 4].map((k) => (
              <li key={k} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-gray-200/70 dark:bg-white/10" />
                  <div className="h-3 w-32 rounded bg-gray-200/70 dark:bg-white/10" />
                  <div className="ml-auto h-3 w-10 rounded bg-gray-200/60 dark:bg-white/10" />
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-[#14181e]" />
              </li>
            ))}
          </ul>
        </div>

        {/* Right card: line chart placeholder with shimmer */}
        <div
          className="
            md:col-span-2 rounded-xl p-3
            border border-gray-100 dark:border-white/10
            bg-white/60 dark:bg-[#0f1318]
          "
        >
          <div className="relative h-[360px] rounded-lg overflow-hidden">
            {/* grid lines */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px bg-gray-200/70 dark:bg-white/10"
                style={{ top: `${(i * 100) / 5}%` }}
              />
            ))}

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

          {/* legend pills */}
          <div className="mt-3 flex gap-4">
            <div className="h-3 w-24 rounded bg-gray-200/70 dark:bg-white/10" />
            <div className="h-3 w-24 rounded bg-gray-200/70 dark:bg-white/10" />
            <div className="h-3 w-28 rounded bg-gray-200/70 dark:bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
