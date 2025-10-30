import { RouteOff as NoDataIcon } from "lucide-react";

type EmptyStateProps = {
  height: number;
  className?: string;
  emptyIcon?: React.ReactNode;
  emptyText: string;
};

export function EmptyState({
  height,
  className = "",
  emptyIcon,
  emptyText,
}: EmptyStateProps) {
  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        {/* icono configurable, por defecto uno de lucide */}
        <div className="text-gray-400 dark:text-gray-500">
          {emptyIcon ?? <NoDataIcon className="h-14 w-14" />}
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-300 font-semibold">
          {emptyText}
        </span>
      </div>
    </div>
  );
}
