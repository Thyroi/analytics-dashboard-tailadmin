import { PROGRESS_WIDTHS } from "./constants";

interface CountryRowSkeletonProps {
  index: number;
}

export function CountryRowSkeleton({ index }: CountryRowSkeletonProps) {
  // Solo el primer país expandido para simplificar
  const isExpanded = index === 0;
  const progressWidth = PROGRESS_WIDTHS[index] || 30;

  return (
    <div>
      {/* País skeleton */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-3">
          {/* Flag placeholder */}
          <div className="h-5 w-7 rounded bg-gray-300 dark:bg-white/20" />

          {/* Nombre del país */}
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10" />
        </div>

        <div className="flex items-center gap-4">
          {/* Barra de progreso */}
          <div className="hidden sm:block">
            <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-red-300 dark:bg-red-400"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>

          {/* Porcentaje */}
          <div className="h-3 w-8 rounded bg-gray-200 dark:bg-white/10" />

          {/* Usuarios */}
          <div className="h-3 w-12 rounded bg-gray-200 dark:bg-white/10" />

          {/* Icono de expansión */}
          <div className="h-4 w-4 rounded bg-gray-200 dark:bg-white/10" />
        </div>
      </div>

      {/* Solo mostrar regiones expandidas en el primer país */}
      {isExpanded && (
        <div className="ml-6 mr-2 mb-2 mt-2">
          {Array.from({ length: 2 }).map((_, regionIndex) => (
            <div
              key={regionIndex}
              className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 p-2 mb-1 dark:border-white/5 dark:bg-white/5"
            >
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="h-2 w-12 rounded-full bg-gray-200 dark:bg-white/10">
                  <div className="h-full w-3/4 rounded-full bg-red-200 dark:bg-red-300" />
                </div>
                <div className="h-3 w-6 rounded bg-gray-200 dark:bg-white/10" />
                <div className="h-3 w-8 rounded bg-gray-200 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
