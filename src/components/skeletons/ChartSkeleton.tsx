// src/components/skeletons/ChartSkeleton.tsx
"use client";
export default function ChartSkeleton({ height = 180 }: { height?: number }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="h-4 w-40 rounded bg-gray-200/70" />
        <div className="h-6 w-6 rounded-full bg-gray-200/70" />
      </div>
      <div className="card-body">
        <div
          className="relative w-full overflow-hidden rounded-xl bg-gray-100"
          style={{ height }}
        >
          <div
            className="absolute inset-0 translate-x-[-100%] animate-[dash-shimmer_1.4s_infinite]"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

