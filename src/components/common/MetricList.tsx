"use client";

import * as React from "react";

export type MetricListItem = {
  id: string;
  label: string;
  value: number;
  color?: string;
  title?: string;
  href?: string;
};

type Props = {
  items: MetricListItem[];
  title?: string;
  totalLabel?: string;
  totalValue?: number;
  valueFormatter?: (v: number) => string;
  totalFormatter?: (v: number) => string;
  emptyStateText?: string;
  className?: string;
  onItemClick?: (item: MetricListItem) => void;
};

export default function MetricList({
  items,
  title,
  totalLabel,
  totalValue,
  valueFormatter = (v: number) => Intl.NumberFormat().format(v),
  totalFormatter = (v: number) => Intl.NumberFormat().format(v),
  emptyStateText = "Sin datos",
  className = "",
  onItemClick,
}: Props) {
  const hasHeader = Boolean(title) || (typeof totalValue === "number" && totalLabel);

  return (
    <div className={className}>
      {hasHeader && (
        <>
          <div className="flex items-center justify-between pb-2">
            {title ? (
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            ) : (
              <span />
            )}
            {typeof totalValue === "number" && totalLabel ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {totalLabel}{" "}
                <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
                  {totalFormatter(totalValue)}
                </span>
              </div>
            ) : null}
          </div>
          <div className="border-t border-gray-200 dark:border-white/10" />
        </>
      )}

      {items.length === 0 ? (
        <div className="pt-2 text-sm text-gray-500 dark:text-gray-400">
          {emptyStateText}
        </div>
      ) : (
        <ul className="divide-y divide-transparent pt-2">
          {items.map((it) => {
            const dotColor = it.color ?? "#9CA3AF";
            const labelNode = it.href ? (
              <a
                href={it.href}
                className="truncate text-sm text-gray-800 dark:text-gray-100 hover:underline"
                title={it.title ?? it.label}
                onClick={(e) => {
                  if (!onItemClick) return;
                  e.preventDefault();
                  onItemClick(it);
                }}
              >
                {it.label}
              </a>
            ) : (
              <span
                className="truncate text-sm text-gray-800 dark:text-gray-100"
                title={it.title ?? it.label}
              >
                {it.label}
              </span>
            );

            return (
              <li
                key={it.id}
                className="py-1.5 flex items-center justify-between gap-4"
                onClick={() => onItemClick?.(it)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-[3px] border border-black/5 dark:border-white/10"
                    style={{ backgroundColor: dotColor }}
                    aria-hidden
                  />
                  {labelNode}
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                  {valueFormatter(it.value)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
