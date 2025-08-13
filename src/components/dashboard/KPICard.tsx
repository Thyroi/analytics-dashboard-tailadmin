import React from "react";

export default function KPICard({
  title,
  value,
  delta,
  deltaVariant = "up",
  icon,
  className = "",
}: {
  title: string;
  value: string;
  delta: string;
  deltaVariant?: "up" | "down";
  icon?: React.ReactNode;
  className?: string;
}) {
  const isDown = deltaVariant === "down";

  return (
    <div className={`card p-4 flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between">
        <div className="text-sm text-gray-500">{title}</div>
        {icon ? (
          <div
            className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center
                       dark:bg-white/5 dark:text-blue-300"
            aria-hidden="true"
          >
            {icon}
          </div>
        ) : null}
      </div>

      <div className="mt-1 flex items-end justify-between">
        <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
        <div
          className={`text-xs font-medium px-2 py-1 rounded-lg ${
            isDown ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
          }`}
        >
          {delta}
        </div>
      </div>
    </div>
  );
}
