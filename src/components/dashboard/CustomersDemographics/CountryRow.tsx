"use client";

import ReactCountryFlag from "react-country-flag";

type Props = {
  code: string;
  name: string;
  users: number;
  pctNum: number;   // 0..100
  pctLabel: string; // "xx.x"
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean; // ← NUEVO
};

export default function CountryRow({
  code,
  name,
  users,
  pctNum,
  pctLabel,
  isOpen,
  onToggle,
  disabled = false,
}: Props) {
  const handleClick = () => {
    if (!disabled) onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        "w-full flex items-center gap-3",
        "rounded-2xl border border-gray-200 dark:border-white/10",
        "bg-white dark:bg-white/[0.06] shadow-sm px-3 py-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/40",
        disabled ? "cursor-default" : "cursor-pointer",
      ].join(" ")}
      aria-expanded={isOpen}
      aria-controls={`regions-${code}`}
      aria-disabled={disabled}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ReactCountryFlag
          svg
          countryCode={code}
          style={{ width: "28px", height: "20px", borderRadius: 4 }}
          title={name}
        />
        <div className="min-w-0 text-left">
          <div className="truncate font-medium text-gray-800 dark:text-white/90">
            {name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
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
                "linear-gradient(90deg, rgba(70,95,255,1) 0%, rgba(70,95,255,0.6) 100%)",
            }}
          />
        </div>
        <div className="w-12 text-right text-sm font-semibold text-gray-700 dark:text-white/80">
          {pctLabel}%
        </div>
      </div>
    </button>
  );
}
