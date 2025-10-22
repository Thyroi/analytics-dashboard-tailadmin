"use client";

import { Users } from "lucide-react";
import React from "react";

type Props = {
  title: string;
  value: number;
  deltaPct: number; // delta porcentual vs periodo anterior
  icon?: React.ReactNode;
  className?: string;
};

function formatNumber(n: number, locale = "es-ES"): string {
  return new Intl.NumberFormat(locale).format(n);
}
function formatDeltaPct(pct: number, locale = "es-ES"): string {
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  const abs = Math.abs(pct);
  const digits = abs >= 10 ? 0 : 1;
  return `${sign}${abs.toLocaleString(locale, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })}%`;
}

export default function GeneralDataHeader({
  title,
  value,
  deltaPct,
  icon,
  className = "",
}: Props) {
  const isDown = deltaPct < 0;

  return (
    <div
      className={`w-full rounded-t-xl bg-white dark:bg-gray-800 px-4 py-3 ${className}`}
    >
      <div className="grid grid-cols-2 gap-2 items-center">
        {/* Izquierda: icono + título */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-huelva-primary text-white flex items-center justify-center">
            {icon ?? <Users className="h-5 w-5" />}
          </div>
          <div className="text-left">
            <div
              className="font-semibold text-gray-900 dark:text-gray-100 leading-tight"
              style={{
                fontSize: "var(--text-theme-sm)",
                lineHeight: "var(--text-theme-sm--line-height)",
              }}
            >
              {title}
            </div>
          </div>
        </div>

        {/* Derecha: valor grande + delta */}
        <div className="ml-auto flex items-baseline justify-end gap-3">
          <span
            className="font-extrabold text-gray-900 dark:text-white leading-none"
            style={{
              fontSize: "clamp(18px, 3.5vw, var(--text-theme-xl))",
              lineHeight: "calc(var(--text-theme-xl--line-height) - 6px)",
            }}
          >
            {formatNumber(value)}
          </span>

          <span
            className={`inline-flex items-center justify-center rounded-full px-2 py-[2px] text-[11px] font-medium leading-none ${
              isDown ? "bg-red-500 text-white" : "bg-green-500 text-white"
            }`}
            title={formatDeltaPct(deltaPct)}
          >
            {formatDeltaPct(deltaPct)}
          </span>
        </div>
      </div>
    </div>
  );
}
