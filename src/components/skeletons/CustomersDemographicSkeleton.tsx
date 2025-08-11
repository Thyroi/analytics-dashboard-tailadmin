// src/components/skeletons/CustomersDemographicSkeleton.tsx
"use client";
export default function CustomersDemographicSkeleton({
  height = 260, rows = 6,
}: { height?: number; rows?: number }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="h-4 w-48 rounded bg-gray-200/70" />
          <div className="mt-2 h-3 w-64 rounded bg-gray-200/60" />
        </div>
        <div className="h-10 w-56 rounded-lg bg-gray-100" />
      </div>
      <div className="card-body">
        {/* mapa */}
        <div className="relative mb-6 w-full overflow-hidden rounded-xl bg-gray-100" style={{ height }}>
          <div
            className="absolute inset-0 translate-x-[-100%] animate-[dash-shimmer_1.4s_infinite]"
            style={{background:"linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 100%)"}}
          />
        </div>

        {/* lista */}
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-5 w-8 rounded bg-gray-200/70" />
              <div className="flex-1">
                <div className="h-3 w-40 rounded bg-gray-200/70" />
                <div className="mt-2 h-2 w-24 rounded bg-gray-200/60" />
              </div>
              <div className="h-2 w-32 rounded bg-gray-200/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

