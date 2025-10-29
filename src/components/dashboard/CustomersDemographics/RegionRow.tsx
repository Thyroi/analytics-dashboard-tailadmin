"use client";

import { Minus, Plus } from "lucide-react";

type Props = {
  region: string;
  users: number;
  pctNum: number;
  pctLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export default function RegionRow({
  region,
  users,
  pctNum,
  pctLabel,
  isOpen,
  onToggle,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      className={`
        w-full flex items-center gap-3
        px-2 py-2
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/30
        ${disabled ? "cursor-default" : "cursor-pointer"}
      `}
      aria-expanded={isOpen && !disabled}
      aria-disabled={disabled}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className="relative inline-flex items-center justify-center h-4 w-4 rounded-full bg-orange-400 text-white shrink-0"
          aria-hidden
        >
          {isOpen ? (
            <Minus className="h-3 w-3" strokeWidth={3} />
          ) : (
            <Plus className="h-3 w-3" strokeWidth={3} />
          )}
        </span>
        <div className="min-w-0 text-left">
          <div className="truncate text-sm text-gray-800 dark:text-white/90">
            {region}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400">
            {users.toLocaleString()} usuarios
          </div>
        </div>
      </div>

      <div className="flex w-1/2 min-w-[180px] items-center gap-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pctNum}%`,
              background:
                "linear-gradient(90deg, rgba(251,146,60,1) 0%, rgba(251,146,60,0.6) 100%)",
            }}
          />
        </div>
        <div className="w-12 text-right text-xs font-semibold text-gray-700 dark:text-white/80">
          {pctLabel}%
        </div>
      </div>
    </button>
  );
}
