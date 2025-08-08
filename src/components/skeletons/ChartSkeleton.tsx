"use client";

type Props = {
  height?: number;
  wrapInCard?: boolean; // si true, incluye .card
  showHeader?: boolean; // si true, pinta header esquelético
};

export default function ChartSkeleton({
  height = 180,
  wrapInCard = true,
  showHeader = true,
}: Props) {
  const Header = showHeader ? (
    <div className="card-header">
      <div>
        <div className="skeleton h-5 w-48 rounded-md" />
        <div className="skeleton mt-2 h-4 w-64 rounded-md" />
      </div>
      <div className="skeleton h-8 w-8 rounded-full" />
    </div>
  ) : null;

  const Body = (
    <div className="card-body">
      <div className="skeleton h-[1px] w-full rounded-md mb-4" />
      <div className="rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-white/5">
        {/* barras fantasma */}
        <div className="flex items-end gap-4 px-4" style={{ height }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex w-full flex-col items-center gap-3">
              <div
                className="skeleton w-6 rounded-md"
                style={{ height: 40 + ((i * 13) % 110) }}
              />
              <div className="skeleton h-3 w-10 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!wrapInCard) return (<>{Header}{Body}</>);
  return (
    <div className="card">
      {Header}
      {Body}
    </div>
  );
}
