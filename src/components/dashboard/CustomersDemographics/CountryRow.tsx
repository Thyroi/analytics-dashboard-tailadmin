"use client";

import ReactCountryFlag from "react-country-flag";

type Props = {
  code: string | null; // ahora permite null
  name: string;
  users: number;
  pctNum: number; // 0..100
  pctLabel: string; // "xx.x"
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean; // ignora click + cursor normal
};

const isUnknown = (code: string | null, name: string) =>
  !code || /\b(not set|unknown)\b/i.test(name);

export default function CountryRow({
  code,
  name,
  users,
  pctNum,
  pctLabel,
  isOpen, // (se sigue recibiendo aunque no se use aquí)
  onToggle,
  disabled = false,
}: Props) {
  const unknown = isUnknown(code, name);

  const Flag = unknown ? (
    <span
      title={name}
      aria-label="Ubicación no establecida"
      className="inline-flex items-center justify-center"
      style={{ width: 28, height: 20 }}
    >
      {/* Mantiene el tamaño del “flag” */}
      <span style={{ fontSize: 16, lineHeight: 1 }}>🔴</span>
    </span>
  ) : (
    <ReactCountryFlag
      svg
      countryCode={code!}
      style={{ width: 28, height: 20, borderRadius: 4 }}
      title={name}
    />
  );

  const actuallyDisabled = disabled || unknown;

  return (
    <button
      type="button"
      onClick={actuallyDisabled ? undefined : onToggle}
      className={`
        w-full flex items-center gap-3
        rounded-2xl border border-gray-200 dark:border-white/10
        bg-white dark:bg-white/[0.06]
        shadow-sm px-3 py-2
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/40
        ${actuallyDisabled ? "cursor-default" : "cursor-pointer"}
      `}
      aria-expanded={!actuallyDisabled && isOpen}
      aria-disabled={actuallyDisabled}
      aria-controls={`regions-${code ?? "unknown"}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {Flag}
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
