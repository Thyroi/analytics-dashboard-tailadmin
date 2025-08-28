"use client";

import * as React from "react";

type HeroIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type Props = {
  label: string;
  count: number;
  icon: HeroIcon;
  iconClassName?: string; // colores del chip del icono
  className?: string;
};

export default function TagStat({
  label,
  count,
  icon: Icon,
  iconClassName = "",
  className = "",
}: Props) {
  return (
    <div
      className={[
        "rounded-xl border border-gray-200 dark:border-white/10 bg-transparent",
        "p-3 overflow-hidden",          // nada se desborda
        "h-16",                         // ~64px => una sola fila estable
        className,
      ].join(" ")}
    >
      {/* Fila: icono + contenido */}
      <div className="flex h-full items-center gap-3">
        {/* Icono más compacto */}
        <div
          className={[
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0", // 40px
            iconClassName,
          ].join(" ")}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Texto dentro del mismo row */}
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className="truncate text-sm font-medium text-gray-900 dark:text-white"
              title={label}
            >
              {label}
            </span>

            {/* Número a la derecha, mismo row */}
            <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
              {Intl.NumberFormat().format(count)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
