import EmptyIcon from "@/components/icons/EmptyIcon";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  emptyIcon?: LucideIcon;
};

export function EmptyState({ emptyIcon }: EmptyStateProps) {
  const EmptyIconComponent = emptyIcon ?? EmptyIcon;

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
      <EmptyIconComponent
        className="h-20 w-20 text-gray-400 dark:text-gray-500"
        aria-hidden
      />
      <span className="text-xs text-gray-600 dark:text-gray-300 font-semibold">
        No se han encontrado datos
      </span>
    </div>
  );
}
