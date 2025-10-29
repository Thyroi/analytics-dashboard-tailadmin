type ChartPairLayoutProps = {
  leftSide: React.ReactNode;
  rightSide: React.ReactNode;
  className?: string;
};

export function ChartPairLayout({
  leftSide,
  rightSide,
  className = "",
}: ChartPairLayoutProps) {
  return (
    <div
      className={`grid grid-cols-1 xl:grid-cols-2 gap-4 xl:items-stretch w-full ${className}`}
    >
      <div className="flex w-full">{leftSide}</div>
      <div className="flex w-full">{rightSide}</div>
    </div>
  );
}
