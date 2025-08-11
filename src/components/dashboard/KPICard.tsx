import React from "react";

export default function KPICard({
  title, value, delta, deltaVariant = "up", className = "",
}: { title: string; value: string; delta: string; deltaVariant?: "up"|"down"; className?: string; }) {
  const isDown = deltaVariant === "down";
  return (
    <div className={`card p-4 ${className}`}>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 flex items-end justify-between">
        <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
        <div className={`text-xs font-medium px-2 py-1 rounded-lg ${isDown ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {delta}
        </div>
      </div>
      {/* sparkline placeholder */}
      <div className="mt-3 h-8 rounded-md bg-gradient-to-r from-blue-50 to-blue-100/40 dark:from-white/5 dark:to-white/10" />
    </div>
  );
}
