"use client";

type Props = {
  /** Alto del donut (no del card) */
  height?: number;
  /** Cantidad de filas fantasma en la leyenda */
  legendItems?: number;
  /** Mostrar el “pill” de acción a la derecha del título */
  showActionPill?: boolean;
  className?: string;
};

export default function DonutCardSkeleton({
  height = 180,
  legendItems = 6,
  showActionPill = true,
  className = "",
}: Props) {
  // mismas clases del wrapper que usa DonutCard (variant="card")
  const wrapperClass =
    "rounded-xl border bg-white p-3 transition-all duration-200 " +
    "border-gray-200 hover:border-red-300 hover:shadow-md " +
    "dark:bg-[#0b0f14] dark:border-white/10";

  return (
    <div className={className}>
      <div className={wrapperClass} aria-busy="true">
        {/* Header (título + acción) */}
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="h-4 w-36 rounded bg-gray-200/70 dark:bg-white/10" />
          {showActionPill && (
            <div className="h-7 w-48 rounded-full bg-red-50 text-red-600 ring-1 ring-red-200/60 dark:bg-white/5 dark:ring-white/10 animate-pulse" />
          )}
        </div>

        {/* Donut placeholder */}
        <div className="relative w-full grid place-items-center">
          <div
            className="relative rounded-full"
            style={{ width: height, height }}
          >
            {/* anillo base */}
            <div
              className="absolute inset-0 rounded-full border-8"
              style={{ borderColor: "rgba(0,0,0,0.06)" }}
            />
            {/* anillo “loading” girando (como una porción coloreada) */}
            <div
              className="absolute inset-0 rounded-full border-8 border-t-transparent border-l-transparent animate-spin"
              style={{ borderColor: "var(--color-huelva-primary, #E55338)" }}
            />
            {/* centro sólido */}
            <div className="absolute inset-4 rounded-full bg-white dark:bg-[#0b0f14]" />
            {/* líneas del centro (valor + label) */}
            <div className="absolute left-1/2 top-1/2 w-14 -translate-x-1/2 -translate-y-1/2 space-y-2">
              <div className="h-4 rounded bg-gray-200/80 dark:bg-white/10" />
              <div className="h-3 rounded bg-gray-200/60 dark:bg-white/10" />
            </div>
          </div>
        </div>

        {/* Leyenda (dos columnas como en interactive) */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {Array.from({ length: legendItems }).map((_, i) => (
            <div
              key={i}
              className="flex h-10 items-center justify-between rounded-lg border p-2 text-sm bg-gray-50 border-gray-200 dark:bg-white/5 dark:border-white/10"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-300 dark:bg-white/20" />
                <span className="h-3 w-32 rounded bg-gray-200/70 dark:bg-white/10" />
              </div>
              <span className="h-3 w-8 rounded bg-gray-200/60 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
