"use client";

type Props = {
  height?: number;
  wrapInCard?: boolean;
  showHeader?: boolean;
  titleWidth?: number;
  subtitleWidth?: number;
};

export default function LineChartSkeleton({
  height = 200,
  wrapInCard = true,
  showHeader = true,
  titleWidth = 180,
  subtitleWidth = 220,
}: Props) {
  const Header = showHeader ? (
    <div className="card-header">
      <div>
        <div className="skeleton h-5 rounded-md" style={{ width: titleWidth }} />
        <div className="skeleton mt-2 h-4 rounded-md" style={{ width: subtitleWidth }} />
      </div>
    </div>
  ) : null;

  const Body = (
    <div className="card-body">
      <div className="rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-white/5">
        <div className="relative w-full" style={{ height }}>
          <div className="absolute inset-0 px-6 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-[1px] w-full rounded-md mb-10 last:mb-0" />
            ))}
          </div>
          <div className="absolute inset-0 px-6">
            <div className="skeleton absolute bottom-10 left-6 right-6 h-0.5 rounded-full" />
          </div>
          <div className="absolute inset-x-6 bottom-8 flex justify-between">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="skeleton h-3 w-3 rounded-full" />
            ))}
          </div>
          <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="skeleton h-3 w-10 rounded-md" />
            ))}
          </div>
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
