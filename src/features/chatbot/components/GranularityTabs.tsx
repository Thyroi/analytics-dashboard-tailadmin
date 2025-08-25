"use client";

import type { Granularity } from "@/lib/chatbot/time";

export default function GranularityTabs({
  value,
  onChange,
  className = "",
}: {
  value: Granularity;
  onChange: (g: Granularity) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-white/5 p-1 ${className}`}>
      {(["day", "week", "month"] as const).map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1.5 text-xs rounded-md transition ${
            value === key
              ? "bg-white dark:bg-[#14181e] shadow border border-gray-200 dark:border-white/10"
              : "text-gray-600 dark:text-gray-300"
          }`}
          aria-pressed={value === key}
        >
          {key === "day" ? "Día" : key === "week" ? "Semana" : "Mes"}
        </button>
      ))}
    </div>
  );
}
