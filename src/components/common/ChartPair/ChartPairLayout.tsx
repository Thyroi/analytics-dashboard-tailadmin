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
      className={`grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch w-full ${className}`}
    >
      <div className="flex w-full h-full">{leftSide}</div>
      <div className="flex w-full h-full">{rightSide}</div>
    </div>
  );
}
