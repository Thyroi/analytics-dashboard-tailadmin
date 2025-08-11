// src/components/skeletons/AreaChartSkeleton.tsx
"use client";
export default function AreaChartSkeleton({ height = 310 }: { height?: number }) {
  return <div className="card"><div className="card-header"><div>
    <div className="h-4 w-40 rounded bg-gray-200/70" />
    <div className="mt-2 h-3 w-60 rounded bg-gray-200/60" />
  </div>
  <div className="h-10 w-56 rounded-lg bg-gray-100" /></div>
  <div className="card-body">
    <div className="relative w-full overflow-hidden rounded-xl bg-gray-100" style={{ height }}>
      <div className="absolute inset-0 translate-x-[-100%] animate-[dash-shimmer_1.4s_infinite]"
        style={{background:"linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 100%)"}} />
    </div>
  </div></div>;
}

