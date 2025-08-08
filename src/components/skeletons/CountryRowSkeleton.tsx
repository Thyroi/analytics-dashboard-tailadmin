"use client";

type Props = {
  nameWidth?: number;   // px
  subWidth?: number;    // px
  barWidth?: string;    // '65%' etc
  showPercent?: boolean;
};

export default function CountryRowSkeleton({
  nameWidth = 160,
  subWidth = 110,
  barWidth = "66%",
  showPercent = true,
}: Props) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="skeleton h-5 w-7 rounded-[4px]" />
        <div className="min-w-0">
          <div className="skeleton mb-2 h-4 rounded-md" style={{ width: nameWidth }} />
          <div className="skeleton h-3 rounded-md" style={{ width: subWidth }} />
        </div>
      </div>

      <div className="flex w-1/2 min-w-[180px] items-center gap-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
          <div className="skeleton h-2 rounded-full" style={{ width: barWidth }} />
        </div>
        {showPercent && <div className="skeleton h-4 w-8 rounded-md" />}
      </div>
    </div>
  );
}
