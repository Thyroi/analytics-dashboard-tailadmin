"use client";

import React from "react";

type DrilldownTitleProps = {
  name: string;
  headlinePercent?: number;
  color?: "dark" | "primary" | "secondary";
};

export default function DrilldownTitle({
  name,
  headlinePercent,
  color = "dark",
}: DrilldownTitleProps) {
  const colorClass = {
    dark: "bg-huelva-dark",
    primary: "bg-huelva-primary",
    secondary: "bg-huelva-secondary",
  }[color];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {/* Círculo de color dinámico */}
        <div className={`w-3 h-3 rounded-full ${colorClass}`} />
        {/* Texto dinámico */}
        <h3 className="text-lg font-medium">Análisis de {name}</h3>
        {/* Pill opcional */}
        {typeof headlinePercent === "number" && (
          <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full">
            {headlinePercent}% del total
          </span>
        )}
      </div>
    </div>
  );
}
