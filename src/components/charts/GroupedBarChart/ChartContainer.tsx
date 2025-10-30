type ChartContainerProps = {
  className?: string;
  children: React.ReactNode;
};

export function ChartContainer({
  className = "",
  children,
}: ChartContainerProps) {
  return (
    <div className={`w-full bg-white dark:bg-gray-800 rounded-lg ${className}`}>
      {children}
    </div>
  );
}
