interface EmptyStateProps {
  height: number | string;
  emptyHint: string;
}

export function EmptyState({ height, emptyHint }: EmptyStateProps) {
  return (
    <div
      className="w-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400"
      style={{
        height: typeof height === "number" ? `${height}px` : height,
      }}
    >
      {emptyHint}
    </div>
  );
}
