type ChartHeaderProps = {
  title?: string;
  subtitle?: string;
};

export function ChartHeader({ title, subtitle }: ChartHeaderProps) {
  if (!title && !subtitle) return null;

  return (
    <div className="p-6 pb-2">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}
