import React from "react";

type Props = {
  className?: string;
  withIcon?: boolean;
};


export default function KPICardSkeleton({ className = "", withIcon = true }: Props) {
  return (
    <div
      className={`card p-4 flex flex-col justify-between animate-pulse ${className}`}
      role="status"
      aria-label="Cargando KPI"
    >
      {/* Título + icono */}
      <div className="flex items-start justify-between">
        <div className="h-3 w-28 rounded bg-gray-200 dark:bg-white/10" />
        {withIcon ? (
          <div className="h-8 w-8 rounded-xl bg-gray-100 dark:bg-white/5" aria-hidden="true" />
        ) : null}
      </div>

      {/* Valor + delta */}
      <div className="mt-1 flex items-end justify-between">
        <div className="h-7 w-24 sm:w-28 rounded bg-gray-200 dark:bg-white/10" />
        <div className="h-5 w-14 rounded-lg bg-gray-100 dark:bg-white/5" />
      </div>

    </div>
  );
}
