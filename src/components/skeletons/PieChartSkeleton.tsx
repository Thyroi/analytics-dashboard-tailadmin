"use client";

type Props = {
  height?: number;
  showLegend?: boolean;
  legendItems?: number;
  className?: string;
};

export default function PieChartSkeleton({
  height = 300,
  showLegend = true,
  legendItems = 3,
  className = "",
}: Props) {
  return (
    <div className={className}>
      <div
        className="relative w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-[#0f1318]"
        style={{ height }}
      >
        {/* shimmer */}
        <div
          className="absolute inset-0 translate-x-[-100%] animate-[dash-shimmer_1.4s_infinite]"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
        {/* sutil círculo central para sugerir el “pie” */}
        <div className="absolute inset-0 grid place-content-center">
          <div className="h-28 w-28 rounded-full bg-white/50 dark:bg-white/10" />
        </div>
      </div>

      {showLegend && (
        <div className="mt-3 flex flex-wrap gap-4">
          {Array.from({ length: legendItems }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-white/20" />
              <span className="h-3 w-20 rounded bg-gray-200 dark:bg-white/10" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
