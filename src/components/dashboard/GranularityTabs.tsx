"use client";

import * as React from "react";
import type { Granularity } from "@/lib/types";
import { motion, LayoutGroup } from "motion/react";

const LABELS: Record<Granularity, string> = {
  d: "Día",
  w: "Semana",
  m: "Mes",
  y: "Año",
};

const ORDER: Granularity[] = ["d", "w", "m", "y"];

export default function GranularityTabs({
  value,
  onChange,
  className = "",
}: {
  value: Granularity;
  onChange: (g: Granularity) => void;
  className?: string;
}) {
  // UID por instancia para evitar colisiones entre múltiples controles
  const uid = React.useId();

  return (
    <LayoutGroup id={`granularity-tabs-${uid}`}>
      <div
        role="tablist"
        aria-label="Granularidad"
        className={`inline-flex bg-gray-100 border border-gray-200 rounded-2xl p-1 ${className}`}
      >
        {ORDER.map((g) => {
          const isActive = value === g;
          return (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(g)}
              className={[
                "relative px-4 py-2 text-sm font-medium transition-colors rounded-2xl",
                isActive ? "text-gray-900" : "text-gray-600 hover:text-gray-800",
              ].join(" ")}
            >
              {isActive && (
                <motion.div
                  // layoutId aislado por instancia
                  layoutId={`granularityActive-${uid}`}
                  className="absolute inset-0 bg-white rounded-2xl shadow-sm ring-1 ring-black/5"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{LABELS[g]}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
