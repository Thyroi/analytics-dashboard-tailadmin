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
    <div className={`kpi-card ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="kpi-title" title={title}>
          {title}
        </div>
        {icon ? (
          <div
            className="hidden md:flex h-8 w-8 shrink-0 rounded-xl
                       bg-blue-50 text-blue-600 items-center justify-center
                       dark:bg-white/5 dark:text-blue-300"
            aria-hidden="true"
          >
            {icon}
          </div>
        ) : null}
      </div>

      {/* Valor + Delta */}
      <div className="kpi-row">
        <div className="kpi-value" title={value}>
          {value}
        </div>
        <div
          className={`kpi-delta ${
            isDown ? "kpi-delta--down" : "kpi-delta--up"
          } shrink-0`}
          title={delta}
        >
          {delta}
        </div>
      </div>
    </div>
  );
}
