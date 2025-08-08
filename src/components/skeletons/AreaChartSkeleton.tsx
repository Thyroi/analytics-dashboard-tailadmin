"use client";

type Props = {
  height?: number;
  wrapInCard?: boolean;
  showHeader?: boolean;
};

export default function AreaChartSkeleton({
  height = 310,
  wrapInCard = true,
  showHeader = true,
}: Props) {
  const Header = showHeader ? (
    <div className="card-header">
      <div>
        <div className="skeleton h-5 w-48 rounded-md" />
        <div className="skeleton mt-2 h-4 w-64 rounded-md" />
      </div>
      <div className="skeleton h-11 w-64 rounded-lg" />
    </div>
  ) : null;

  const Body = (
    <div className="card-body">
      <div className="rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-white/5">
        <div className="relative w-full" style={{ height }}>
          {/* grid lines */}
          <div className="absolute inset-0 px-6 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-[1px] w-full rounded-md mb-10 last:mb-0" />
            ))}
          </div>
          {/* curva fantasma */}
          <div className="absolute inset-0 flex items-end px-6">
            <div className="skeleton h-[60%] w-full rounded-xl" />
          </div>
          {/* etiquetas eje X */}
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
