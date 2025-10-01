"use client";

type Props = {
  rows?: number;
  className?: string;
  rowHeight?: number;
};

export default function CityListSkeleton({
  rows = 4,
  className = "",
  rowHeight = 32,
}: Props) {
  return (
    <div
      className={`relative space-y-1 rounded-lg ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Shimmer overlay (matching your AreaChartSkeleton) */}
      <div
        className="
          pointer-events-none absolute inset-0 translate-x-[-100%]
          animate-[dash-shimmer_1.4s_infinite]
          block dark:hidden
        "
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 100%)",
        }}
        aria-hidden
      />
      <div
        className="
          pointer-events-none absolute inset-0 translate-x-[-100%]
          animate-[dash-shimmer_1.4s_infinite]
          hidden dark:block
        "
        style={{
          background:
            "linear-gradient(90deg, rgba(20,24,30,0) 0%, rgba(255,255,255,0.12) 50%, rgba(20,24,30,0) 100%)",
        }}
        aria-hidden
      />

      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-md px-1.5 py-1"
          style={{ height: rowHeight }}
        >
          {/* Izquierda: punto + dos líneas (titulo y subtexto) */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-black/10 dark:bg-white/10 shrink-0" />
            <div className="min-w-0">
              <div className="h-3 w-36 max-w-[55%] rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-1 h-2 w-20 max-w-[30%] rounded bg-black/10 dark:bg-white/10" />
            </div>
          </div>

          {/* Derecha: barra + etiqueta porcentaje */}
          <div className="flex w-1/2 min-w-[180px] items-center gap-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div className="h-2 w-2/3 rounded-full bg-black/20 dark:bg-white/20" />
            </div>
            <div className="h-3 w-8 rounded bg-black/10 dark:bg-white/10" />
          </div>
        </div>
      ))}

      <span className="sr-only">Cargando ciudades…</span>
    </div>
  );
}
