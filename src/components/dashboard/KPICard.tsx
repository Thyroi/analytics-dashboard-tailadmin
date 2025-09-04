"use client";

import React from "react";

type Props = {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
  delta?: string;
  deltaVariant?: "up" | "down";
};

export default function KPICard({
  title,
  value,
  icon,
  className = "",
  delta,
  deltaVariant = "up",
}: Props) {
  const isDown = deltaVariant === "down";

  return (
    <div
      className={`w-[250px] rounded-xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-black/5 overflow-hidden p-4 ${className}`}
    >
      <div className="grid grid-cols-[64px_1fr] grid-rows-2 h-full">
        {/* Icono (col izquierda, ocupa ambas filas) */}
        <div className="row-span-2 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-huelva-primary text-white flex items-center justify-center">
            {icon ?? null}
          </div>
        </div>

        {/* Título (fila 1) */}
        <div className="flex items-end justify-start px-2">
          <span
            title={title}
            className="font-semibold text-gray-900 dark:text-gray-100 leading-tight"
            style={{
              fontSize: "var(--text-theme-sm)",
              lineHeight: "var(--text-theme-sm--line-height)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
        </div>

        {/* Valor (fila 2) + Delta */}
        <div className="flex items-center justify-start px-2">
          <span
            title={String(value)}
            className="font-extrabold text-gray-900 dark:text-white leading-none"
            style={{
              fontSize: "clamp(18px, 3.5vw, var(--text-theme-xl))",
              lineHeight: "calc(var(--text-theme-xl--line-height) - 6px)",
            }}
          >
            {value}
          </span>

          {delta ? (
            <span
              className={`ml-auto inline-flex items-center justify-center rounded-full px-2 py-[2px] text-[11px] font-medium leading-none ${
                isDown ? "bg-red-500 text-white" : "bg-green-500 text-white"
              }`}
              title={delta}
            >
              {delta}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
