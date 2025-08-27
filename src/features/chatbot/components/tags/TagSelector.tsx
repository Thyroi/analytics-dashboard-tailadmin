"use client";
import * as React from "react";

type Option = { value: string; label: string };

type Props = {
  value: string;
  options: Option[];
  onChange: (next: string) => void;
  prefixLabel?: string;       // texto antes del selector (default: "Tags")
  suffixText?: string;        // texto después del selector (ej: "• Subtags (últimos 7 días)")
  className?: string;
};

export default function TagSelector({
  value,
  options,
  onChange,
  prefixLabel = "Tags",
  suffixText,
  className = "",
}: Props) {
  const selectId = React.useId();

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <label htmlFor={selectId} className="text-sm text-gray-500">
        {prefixLabel}
      </label>
      <span className="text-gray-400" aria-hidden>
        ›
      </span>

      <select
        id={selectId}
        className="bg-transparent border-none focus:ring-0 text-sm text-gray-900 dark:text-white"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {suffixText ? (
        <span className="text-sm text-gray-400">{suffixText}</span>
      ) : null}
    </div>
  );
}
