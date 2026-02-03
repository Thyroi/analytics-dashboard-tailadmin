"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

export type Column<T> = {
  header: string;
  // cómo renderizar la celda
  cell: (row: T) => React.ReactNode;
  // accesores opcionales para búsqueda
  searchValue?: (row: T) => string;
  className?: string;
  width?: string;
};

export type RowAction<T> = {
  label: string;
  onClick: (row: T) => void | Promise<void>;
  tone?: "default" | "primary" | "danger";
  icon?: React.ReactNode;
  iconOnly?: boolean;
};

type DataTableProps<T> = {
  title: string;
  data: T[];
  columns: Column<T>[];
  actions?: RowAction<T>[];
  loading?: boolean;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  // si no lo pasas, usa filtro interno con searchValue
  onSearchChange?: (value: string) => void;
  emptyState?: React.ReactNode;
};

export default function DataTable<T>({
  title,
  data,
  columns,
  actions,
  loading,
  enableSearch = true,
  searchPlaceholder = "Search...",
  onSearchChange,
  emptyState,
}: DataTableProps<T>) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!enableSearch || onSearchChange) return data; // el padre controla
    if (!q.trim()) return data;

    const lowers = q.toLowerCase();
    return data.filter((row) =>
      columns.some((c) => {
        if (!c.searchValue) return false;
        const v = c.searchValue(row)?.toLowerCase?.() ?? "";
        return v.includes(lowers);
      }),
    );
  }, [q, data, columns, enableSearch, onSearchChange]);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {enableSearch && (
          <div className="relative w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-10 pr-3 py-2 text-sm outline-none"
              placeholder={searchPlaceholder}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                onSearchChange?.(e.target.value);
              }}
            />
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 font-medium ${c.className ?? ""}`}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.header}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-4 py-3 font-medium text-gray-500">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={(columns?.length ?? 0) + (actions?.length ? 1 : 0)}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={(columns?.length ?? 0) + (actions?.length ? 1 : 0)}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  {emptyState ?? "No data"}
                </td>
              </tr>
            ) : (
              filtered.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/50"
                >
                  {columns.map((c, i) => (
                    <td key={i} className={`px-4 py-3 ${c.className ?? ""}`}>
                      {c.cell(row)}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {actions.map((a, ai) => (
                          <button
                            key={ai}
                            onClick={() => a.onClick(row)}
                            aria-label={a.label}
                            title={a.iconOnly ? a.label : undefined}
                            className={[
                              "inline-flex items-center gap-1 rounded-lg text-xs font-medium border",
                              a.iconOnly ? "px-2 py-2" : "px-2.5 py-1.5",
                              a.tone === "danger"
                                ? "text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/40"
                                : a.tone === "primary"
                                  ? "text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-950/40"
                                  : "text-gray-700 border-gray-200 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800",
                            ].join(" ")}
                          >
                            {a.icon}
                            {a.iconOnly ? (
                              <span className="sr-only">{a.label}</span>
                            ) : (
                              a.label
                            )}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
