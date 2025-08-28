// src/components/skeletons/TopPagesCardSkeleton.tsx
"use client";

type Props = {
  /** Tamaño del donut (ancho/alto en px) */
  donutSize?: number;
  /** Alto de la gráfica de líneas (px) */
  chartHeight?: number;
  /** Filas de la lista izquierda */
  rows?: number;
  /** Clases extra para el contenedor */
  className?: string;
};

export default function TopPagesCardSkeleton({
  donutSize = 220,
  chartHeight = 320,
  rows = 6,
  className = "",
}: Props) {
  // Anillo interior del donut
  const ring = Math.max(12, Math.floor(donutSize * 0.08));

  return (
    <section className={`mt-8 ${className}`}>
      <div
        className="
          rounded-2xl border border-gray-200 dark:border-white/10
          bg-white dark:bg-[#14181e]
          p-4 pl-10
          animate-pulse
        "
        aria-busy="true"
        aria-live="polite"
      >
        {/* ===== Header (título + subtítulo a la izquierda, "controles" a la derecha) ===== */}
        <div className="flex items-start justify-between pr-6">
          <div className="space-y-2">
            <div className="h-5 w-56 rounded bg-gray-200 dark:bg-white/10" />
            <div className="h-4 w-72 rounded bg-gray-200 dark:bg-white/10" />
          </div>
          <div className="flex gap-2">
            <div className="h-7 w-16 rounded-md bg-gray-200 dark:bg-white/10" />
            <div className="h-7 w-20 rounded-md bg-gray-200 dark:bg-white/10" />
            <div className="h-7 w-16 rounded-md bg-gray-200 dark:bg-white/10" />
          </div>
        </div>

        {/* ===== Grid 3 columnas como en la card real ===== */}
        <div className="mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* Columna IZQUIERDA: header de lista + lista */}
          <div className="xl:col-span-3 flex flex-col">
            {/* mini header lista */}
            <div className="flex items-center justify-between pb-2">
              <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10" />
              <div className="h-4 w-28 rounded bg-gray-200 dark:bg-white/10" />
            </div>
            <div className="h-px w-full bg-gray-100 dark:bg-white/10" />
            {/* lista de páginas */}
            <ul className="divide-y divide-transparent pt-2">
              {Array.from({ length: rows }).map((_, i: number) => (
                <li key={i} className="py-1.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-gray-200 dark:bg-white/10" />
                    <span className="h-3 w-40 rounded bg-gray-200 dark:bg-white/10" />
                  </div>
                  <span className="h-3 w-12 rounded bg-gray-200 dark:bg-white/10" />
                </li>
              ))}
            </ul>
          </div>

          {/* Columna CENTRAL: donut skeleton con shimmer */}
          <div className="xl:col-span-3 flex items-center justify-center">
            <div
              className="relative rounded-full bg-gray-100 dark:bg-[#0f1318] overflow-hidden"
              style={{ width: donutSize, height: donutSize }}
              aria-hidden
            >
              {/* agujero central */}
              <div
                className="absolute rounded-full bg-white dark:bg-[#14181e]"
                style={{ inset: ring }}
              />
              {/* shimmer claro */}
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
              {/* shimmer oscuro */}
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

          {/* Columna DERECHA: área para la gráfica de líneas con shimmer */}
          <div className="xl:col-span-6">
            <div className="mb-2 h-4 w-40 rounded bg-gray-200 dark:bg-white/10" />
            <div
              className="
                relative w-full overflow-hidden rounded-xl
                bg-gray-100 dark:bg-[#0f1318]
              "
              style={{ height: chartHeight }}
            >
              {/* shimmer claro */}
              <div
                className="
                  absolute inset-0 translate-x-[-100%]
                  animate-[dash-shimmer_1.4s_infinite]
                  block dark:hidden
                "
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.45) 50%, rgba(255,255,255,0) 100%)",
                }}
              />
              {/* shimmer oscuro */}
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
      </div>
    </section>
  );
}
