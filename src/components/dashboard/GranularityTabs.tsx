"use client";

import * as React from "react";
import type { Granularity } from "@/lib/chatbot/tags";

export default function GranularityTabs({
  value, onChange, className = "",
}: { value: Granularity; onChange: (g: Granularity) => void; className?: string }) {
  return (
    <div className={`inline-flex rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#14181e] p-1 ${className}`}>
      {(["d","w","m", "y"] as Granularity[]).map((g) => (
        <button
          key={g}
          onClick={() => onChange(g)}
          className={`px-3 py-1.5 text-sm rounded-lg ${
            value === g ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
          }`}
          aria-pressed={value === g}
        >
          {g === "d" ? "Día" : g === "w" ? "Semana" : g === "m" ? "Mes":"Año"}
        </button>
      ))}
    </div>
  );
}
