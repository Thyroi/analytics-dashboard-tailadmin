"use client";

type Props = {
  height?: number | string; // default 320
  className?: string;
};

export default function ChartSectionSkeleton({
  height = 320,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3 ${className}`}
    >
      <div
        className="relative w-full overflow-hidden rounded-md bg-gray-100 dark:bg-white/5"
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        {/* shimmer light */}
        <div
          className="absolute inset-0 translate-x-[-100%] animate-[dash-shimmer_1.4s_infinite] block dark:hidden"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
        {/* shimmer dark */}
        <div
          className="absolute inset-0 translate-x-[-100%] animate-[dash-shimmer_1.4s_infinite] hidden dark:block"
          style={{
            background:
              "linear-gradient(90deg, rgba(20,24,30,0) 0%, rgba(255,255,255,0.12) 50%, rgba(20,24,30,0) 100%)",
          }}
        />
      </div>
    </div>
  );
}
