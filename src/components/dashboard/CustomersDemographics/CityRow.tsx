"use client";

type Props = {
  city: string;
  users: number;
  pctNum: number;
  pctLabel: string;
};

export default function CityRow({ city, users, pctNum, pctLabel }: Props) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full bg-orange-300 shrink-0"
          aria-hidden
        />
        <div className="min-w-0 text-left">
          <div className="truncate text-[13px] text-gray-800 dark:text-white/90">
            {city}
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
                "linear-gradient(90deg, rgba(253,186,116,1) 0%, rgba(253,186,116,0.6) 100%)",
            }}
          />
        </div>
        <div className="w-12 text-right text-[11px] font-semibold text-gray-700 dark:text-white/80">
          {pctLabel}%
        </div>
      </div>
    </div>
  );
}
